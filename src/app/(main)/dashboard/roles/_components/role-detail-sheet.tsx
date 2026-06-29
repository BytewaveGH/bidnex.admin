"use client";

import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/api-client";
import { getInitials } from "@/lib/utils";

import { RoleServices } from "../_logics/services";
import { ACTION_LABELS, type IRole, type IRoleWithUsers, RESOURCE_LABELS } from "./roles-table/data";

// ── Types ─────────────────────────────────────────────────────────────────────

interface IAdminUser {
  id: number;
  username: string;
  email: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseRoleDetail(res: unknown): IRoleWithUsers | null {
  const r = res as { data?: IRoleWithUsers | { data?: IRoleWithUsers } };
  const inner = r?.data;
  if (!inner) return null;
  if ("id" in (inner as object)) return inner as IRoleWithUsers;
  return (inner as { data?: IRoleWithUsers })?.data ?? null;
}

function normaliseUsers(res: unknown): IAdminUser[] {
  const r = res as { data?: IAdminUser[] | { data?: IAdminUser[] } };
  const inner = r?.data;
  if (Array.isArray(inner)) return inner;
  return (inner as { data?: IAdminUser[] })?.data ?? [];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function groupPermissions(permissions: string[]) {
  const map = new Map<string, string[]>();
  for (const key of permissions) {
    const [resource, action] = key.split(".");
    const actions = map.get(resource) ?? [];
    actions.push(action);
    map.set(resource, actions);
  }
  return map;
}

// ── Member row ────────────────────────────────────────────────────────────────

function MemberRow({
  user,
  onRemove,
  isRemoving,
}: {
  user: { id: number; username: string; email: string; assignedAt: string };
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const { assignedAt } = user;
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback className="text-xs">{getInitials(user.username)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{user.username}</p>
        <p className="truncate text-muted-foreground text-xs">{user.email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground text-xs">{formatDate(assignedAt)}</span>
        <Button
          size="icon-sm"
          variant="ghost"
          className="size-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={isRemoving}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface RoleDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: IRole | null;
}

export function RoleDetailSheet({ open, onOpenChange, role }: RoleDetailSheetProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [assignOpen, setAssignOpen] = React.useState(false);
  const [removingUserId, setRemovingUserId] = React.useState<number | null>(null);

  // ── Fetch role detail (includes users) ───────────────────────────────────
  const { data: detailRaw } = useQuery({
    queryKey: ["admin-role-detail", role?.id],
    queryFn: () => {
      const svc = RoleServices.FetchById(role?.id);
      return apiRequest(svc.endpoint, token);
    },
    enabled: !!token && !!role?.id && open,
    staleTime: 0,
  });
  const detail = React.useMemo(() => normaliseRoleDetail(detailRaw), [detailRaw]);

  // ── Fetch admin users for the assign picker ───────────────────────────────
  const { data: usersRaw } = useQuery({
    queryKey: ["admin-users-for-assign"],
    queryFn: () => apiRequest("/admin/users?accountType=admin&limit=200", token),
    enabled: !!token && assignOpen,
    staleTime: 60_000,
  });
  const allAdminUsers = React.useMemo(() => normaliseUsers(usersRaw), [usersRaw]);

  // Filter out users already in the role
  const assignedIds = new Set((detail?.users ?? []).map((u) => u.id));
  const assignableUsers = allAdminUsers.filter((u) => !assignedIds.has(u.id));

  // ── Assign mutation ───────────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: async (userId: number) => {
      const svc = RoleServices.AssignRole(userId, role?.id);
      return apiRequest(svc.endpoint, token, { method: svc.method, body: svc.body });
    },
    onSuccess: (_, userId) => {
      const user = allAdminUsers.find((u) => u.id === userId);
      toast.success(`${user?.username ?? "User"} assigned to ${role?.label}.`);
      setAssignOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-role-detail", role?.id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to assign user."),
  });

  // ── Remove mutation ───────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: async (userId: number) => {
      const svc = RoleServices.RemoveRole(userId, role?.id);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onMutate: (userId) => setRemovingUserId(userId),
    onSuccess: (_, userId) => {
      const user = (detail?.users ?? []).find((u) => u.id === userId);
      toast.success(`${user?.username ?? "User"} removed from ${role?.label}.`);
      void queryClient.invalidateQueries({ queryKey: ["admin-role-detail", role?.id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to remove user."),
    onSettled: () => setRemovingUserId(null),
  });

  if (!role) return null;

  const permissionGroups = groupPermissions(role.permissions);
  const resourceOrder = Object.keys(RESOURCE_LABELS);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 pb-4">
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1">{role.label}</SheetTitle>
            <Badge variant={role.isSystem ? "secondary" : "outline"} className="shrink-0">
              {role.isSystem ? "System" : "Custom"}
            </Badge>
          </div>
          <SheetDescription className="font-mono text-xs">{role.name}</SheetDescription>
          {role.description && <p className="text-muted-foreground text-sm">{role.description}</p>}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-5 p-5">
            {/* Permissions */}
            <div>
              <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Permissions ({role.permissions.length})
              </p>
              <div className="flex flex-col gap-2">
                {[...permissionGroups.entries()]
                  .sort(([a], [b]) => {
                    const ai = resourceOrder.indexOf(a);
                    const bi = resourceOrder.indexOf(b);
                    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                  })
                  .map(([resource, actions]) => (
                    <div key={resource} className="flex items-start gap-2">
                      <span className="w-36 shrink-0 text-muted-foreground text-sm">
                        {RESOURCE_LABELS[resource] ?? resource}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {actions.map((action) => (
                          <Badge key={action} variant="secondary" className="rounded-sm text-xs">
                            {ACTION_LABELS[action] ?? action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                {role.permissions.length === 0 && (
                  <p className="text-muted-foreground text-sm">No permissions assigned.</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Members */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Members ({detail?.users?.length ?? 0})
                </p>
                <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                      <UserPlus className="size-3.5" />
                      Assign user
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search admin users…" className="h-8" />
                      <CommandList>
                        <CommandEmpty>No admin users found.</CommandEmpty>
                        <CommandGroup>
                          {assignableUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.username} ${user.email}`}
                              onSelect={() => assignMutation.mutate(user.id)}
                              className="gap-2"
                            >
                              <Avatar size="sm" className="size-5 shrink-0">
                                <AvatarFallback className="text-[10px]">{getInitials(user.username)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm">{user.username}</p>
                                <p className="truncate text-muted-foreground text-xs">{user.email}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="divide-y divide-border/60">
                {(detail?.users ?? []).length === 0 ? (
                  <p className="py-3 text-muted-foreground text-sm">No members assigned.</p>
                ) : (
                  (detail?.users ?? []).map((user) => (
                    <MemberRow
                      key={user.id}
                      user={user}
                      onRemove={() => removeMutation.mutate(user.id)}
                      isRemoving={removingUserId === user.id}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
