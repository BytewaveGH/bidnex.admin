"use client";
"use no memo";

import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Mail, Phone, X, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/api-client";
import { cn, getInitials } from "@/lib/utils";

import { RoleServices } from "../../roles/_logics/services";
import { accountTypeMeta, type IAdminUser, statusMeta } from "./data";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IRole {
  id: number;
  name: string;
  label: string;
  isSystem: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseRoles(res: unknown): IRole[] {
  const r = res as { data?: IRole[] | { data?: IRole[] } };
  const inner = r?.data;
  if (Array.isArray(inner)) return inner;
  return (inner as { data?: IRole[] })?.data ?? [];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="text-right font-medium text-sm">{children}</div>
    </div>
  );
}

const avatarTones = [
  "[&_[data-slot=avatar-fallback]]:bg-amber-100 [&_[data-slot=avatar-fallback]]:text-amber-700 dark:[&_[data-slot=avatar-fallback]]:bg-amber-500/15 dark:[&_[data-slot=avatar-fallback]]:text-amber-300",
  "[&_[data-slot=avatar-fallback]]:bg-sky-100 [&_[data-slot=avatar-fallback]]:text-sky-700 dark:[&_[data-slot=avatar-fallback]]:bg-sky-500/15 dark:[&_[data-slot=avatar-fallback]]:text-sky-300",
  "[&_[data-slot=avatar-fallback]]:bg-violet-100 [&_[data-slot=avatar-fallback]]:text-violet-700 dark:[&_[data-slot=avatar-fallback]]:bg-violet-500/15 dark:[&_[data-slot=avatar-fallback]]:text-violet-300",
  "[&_[data-slot=avatar-fallback]]:bg-emerald-100 [&_[data-slot=avatar-fallback]]:text-emerald-700 dark:[&_[data-slot=avatar-fallback]]:bg-emerald-500/15 dark:[&_[data-slot=avatar-fallback]]:text-emerald-300",
  "[&_[data-slot=avatar-fallback]]:bg-rose-100 [&_[data-slot=avatar-fallback]]:text-rose-700 dark:[&_[data-slot=avatar-fallback]]:bg-rose-500/15 dark:[&_[data-slot=avatar-fallback]]:text-rose-300",
  "[&_[data-slot=avatar-fallback]]:bg-fuchsia-100 [&_[data-slot=avatar-fallback]]:text-fuchsia-700 dark:[&_[data-slot=avatar-fallback]]:bg-fuchsia-500/15 dark:[&_[data-slot=avatar-fallback]]:text-fuchsia-300",
  "[&_[data-slot=avatar-fallback]]:bg-orange-100 [&_[data-slot=avatar-fallback]]:text-orange-700 dark:[&_[data-slot=avatar-fallback]]:bg-orange-500/15 dark:[&_[data-slot=avatar-fallback]]:text-orange-300",
  "[&_[data-slot=avatar-fallback]]:bg-indigo-100 [&_[data-slot=avatar-fallback]]:text-indigo-700 dark:[&_[data-slot=avatar-fallback]]:bg-indigo-500/15 dark:[&_[data-slot=avatar-fallback]]:text-indigo-300",
];

function getAvatarTone(name: string) {
  return avatarTones[name.length % avatarTones.length];
}

// ── Roles section ─────────────────────────────────────────────────────────────

function UserRoles({ user, token }: { user: IAdminUser; token: string | undefined }) {
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<number | null>(null);

  const userRolesKey = ["admin-user-roles", user.id];

  // Fetch this user's roles
  const { data: userRolesRaw } = useQuery({
    queryKey: userRolesKey,
    queryFn: () => {
      const svc = RoleServices.FetchUserRoles(user.id);
      return apiRequest(svc.endpoint, token);
    },
    enabled: !!token,
    staleTime: 0,
  });
  const userRoles = React.useMemo(() => normaliseRoles(userRolesRaw), [userRolesRaw]);

  // Fetch all roles for the picker (only when popover open)
  const { data: allRolesRaw } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => apiRequest("/admin/roles", token),
    enabled: !!token && assignOpen,
    staleTime: 60_000,
  });
  const allRoles = React.useMemo(() => normaliseRoles(allRolesRaw), [allRolesRaw]);

  const assignedIds = new Set(userRoles.map((r) => r.id));
  const assignableRoles = allRoles.filter((r) => !assignedIds.has(r.id));

  // Assign role
  const assignMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const svc = RoleServices.AssignRole(user.id, roleId);
      return apiRequest(svc.endpoint, token, { method: svc.method, body: svc.body });
    },
    onSuccess: (_, roleId) => {
      const role = allRoles.find((r) => r.id === roleId);
      toast.success(`${role?.label ?? "Role"} assigned to ${user.username}.`);
      setAssignOpen(false);
      void queryClient.invalidateQueries({ queryKey: userRolesKey });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to assign role."),
  });

  // Remove role
  const removeMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const svc = RoleServices.RemoveRole(user.id, roleId);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onMutate: (id) => setRemovingId(id),
    onSuccess: (_, roleId) => {
      const role = userRoles.find((r) => r.id === roleId);
      toast.success(`${role?.label ?? "Role"} removed from ${user.username}.`);
      void queryClient.invalidateQueries({ queryKey: userRolesKey });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to remove role."),
    onSettled: () => setRemovingId(null),
  });

  return (
    <div>
      <div className="flex items-center justify-between pt-2 pb-1">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Roles</p>
        <Popover open={assignOpen} onOpenChange={setAssignOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              + Add role
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search roles…" className="h-8" />
              <CommandList>
                <CommandEmpty>No roles available.</CommandEmpty>
                <CommandGroup>
                  {assignableRoles.map((role) => (
                    <CommandItem key={role.id} value={role.label} onSelect={() => assignMutation.mutate(role.id)}>
                      <span className="text-sm">{role.label}</span>
                      {role.isSystem && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          System
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {userRoles.length === 0 ? (
        <p className="py-1 text-muted-foreground text-sm">No roles assigned.</p>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {userRoles.map((role) => (
            <div
              key={role.id}
              className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 py-0.5 pr-1 pl-2.5 text-sm"
            >
              <span>{role.label}</span>
              <button
                type="button"
                onClick={() => removeMutation.mutate(role.id)}
                disabled={removingId === role.id}
                className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface UserDetailSheetProps {
  user: IAdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  if (!user) return null;

  const typeMeta = accountTypeMeta[user.accountType];
  const sMeta = statusMeta[user.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 pb-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className={cn("shrink-0 font-semibold text-base", getAvatarTone(user.username))}>
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="truncate">{user.username}</SheetTitle>
              <SheetDescription className="truncate">{user.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5">
          <div className="py-1">
            <div className="divide-y divide-border/60">
              <InfoRow label="User ID">
                <span className="font-mono text-muted-foreground text-xs">#{user.id}</span>
              </InfoRow>

              <InfoRow label="Account type">
                <Badge className={cn("rounded-full border font-medium", typeMeta.badgeClass)} variant="outline">
                  {typeMeta.label}
                </Badge>
              </InfoRow>

              <InfoRow label="Status">
                <Badge
                  className={cn("gap-1.5 border px-2 py-1 font-medium capitalize", sMeta.badgeClass)}
                  variant="outline"
                >
                  <span className={cn("size-1.5 rounded-full", sMeta.dotClass)} />
                  {user.status}
                </Badge>
              </InfoRow>

              <InfoRow label="Verified">
                {user.isVerified ? (
                  <span className="flex items-center justify-end gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center justify-end gap-1.5 text-muted-foreground">
                    <XCircle className="size-4" />
                    Not verified
                  </span>
                )}
              </InfoRow>

              <InfoRow label="Joined">{formatDate(user.createdAt)}</InfoRow>
            </div>
          </div>

          <Separator className="my-1" />

          <div className="py-1">
            <p className="pt-2 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">Contact</p>
            <div className="divide-y divide-border/60">
              <InfoRow label="Email">
                <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                  <Mail className="size-3.5" />
                  {user.email}
                </a>
              </InfoRow>

              <InfoRow label="Phone">
                {user.phone ? (
                  <a href={`tel:${user.phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                    <Phone className="size-3.5" />
                    {user.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </InfoRow>
            </div>
          </div>

          {/* Roles section — only shown for admin users */}
          {user.accountType === "admin" && (
            <>
              <Separator className="my-1" />
              <div className="pb-4">
                <UserRoles user={user} token={token} />
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
