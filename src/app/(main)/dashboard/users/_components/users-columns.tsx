"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, getInitials } from "@/lib/utils";

import { accountTypeMeta, type IAdminUser, statusMeta } from "./data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

export interface UsersColumnCallbacks {
  onSuspend: (user: IAdminUser) => void;
  onActivate: (user: IAdminUser) => void;
  onView: (user: IAdminUser) => void;
  loadingUserId: number | null;
}

export function makeUsersColumns(callbacks: UsersColumnCallbacks): ColumnDef<IAdminUser>[] {
  const { onSuspend, onActivate, onView, loadingUserId } = callbacks;

  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label="Select all users"
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={`Select ${row.original.username}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar size="lg" className={cn("font-medium", getAvatarTone(row.original.username))}>
            <AvatarFallback>{getInitials(row.original.username)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground text-sm">{row.original.username}</div>
            <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <div className="text-muted-foreground text-sm tabular-nums">{row.original.phone ?? "—"}</div>,
      enableSorting: false,
    },
    {
      accessorKey: "accountType",
      id: "type",
      header: "Type",
      cell: ({ row }) => {
        const meta = accountTypeMeta[row.original.accountType];
        return (
          <Badge className={cn("rounded-full border font-medium", meta.badgeClass)} variant="outline">
            {meta.label}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "isVerified",
      header: "Verified",
      cell: ({ row }) =>
        row.original.isVerified ? (
          <CheckCircle2 className="size-4.5 text-emerald-500" />
        ) : (
          <XCircle className="size-4.5 text-muted-foreground/40" />
        ),
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const meta = statusMeta[row.original.status];
        return (
          <Badge className={cn("gap-1.5 border px-2 py-1 font-medium capitalize", meta.badgeClass)} variant="outline">
            <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
            {row.original.status}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      header: "Joined",
      cell: ({ row }) => <div className="whitespace-nowrap text-sm">{formatDate(row.original.createdAt)}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;
        const isSuspended = user.status === "suspended";
        const isLoading = loadingUserId === user.id;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={isLoading}
              className={
                isSuspended
                  ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
                  : "text-orange-600 hover:bg-orange-500/10 hover:text-orange-600 dark:text-orange-400"
              }
              onClick={() => (isSuspended ? onActivate(user) : onSuspend(user))}
            >
              {isLoading ? "…" : isSuspended ? "Activate" : "Suspend"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onView(user)}>
              View
            </Button>
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
