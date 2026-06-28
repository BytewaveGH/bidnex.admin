"use client";

import { CheckCircle2, Mail, Phone, XCircle } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn, getInitials } from "@/lib/utils";

import { accountTypeMeta, type IAdminUser, statusMeta } from "./data";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="text-right font-medium text-sm">{children}</div>
    </div>
  );
}

interface UserDetailSheetProps {
  user: IAdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailSheet({ user, open, onOpenChange }: UserDetailSheetProps) {
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
