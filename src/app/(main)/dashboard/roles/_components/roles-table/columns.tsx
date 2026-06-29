"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ACTION_LABELS, RESOURCE_LABELS, type Role } from "./data";

interface RoleColumnCallbacks {
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

function PermissionBadges({ permissions }: { permissions: string[] }) {
  const visible = permissions.slice(0, 3);
  const rest = permissions.length - 3;

  return (
    <div className="flex flex-wrap items-center justify-start gap-1.5">
      {visible.map((key) => {
        const [resource, action] = key.split(".");
        const label = `${RESOURCE_LABELS[resource] ?? resource}: ${ACTION_LABELS[action] ?? action}`;
        return (
          <Badge key={key} className="rounded-sm text-xs" variant="outline">
            {label}
          </Badge>
        );
      })}
      {rest > 0 && <span className="text-muted-foreground text-sm tabular-nums">+{rest}</span>}
    </div>
  );
}

export function makeRolesColumns({ onView, onEdit, onDelete }: RoleColumnCallbacks): ColumnDef<Role>[] {
  return [
    // Hidden accessor used for group-by in the table
    {
      id: "group",
      accessorFn: (row) => (row.isSystem ? "System roles" : "Custom roles"),
      filterFn: "equalsString",
      enableHiding: true,
    },
    // Hidden accessor used for global search
    {
      id: "search",
      accessorFn: (row) => [row.label, row.name, row.description ?? ""].join(" "),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "label",
      accessorKey: "label",
      header: "Role",
      size: 200,
      minSize: 160,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm">{row.original.label}</span>
          <span className="font-mono text-muted-foreground text-xs">{row.original.name}</span>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      size: 110,
      accessorFn: (row) => (row.isSystem ? "System" : "Custom"),
      cell: ({ row }) =>
        row.original.isSystem ? (
          <Badge className="rounded-sm" variant="secondary">
            System
          </Badge>
        ) : (
          <Badge className="rounded-sm" variant="outline">
            Custom
          </Badge>
        ),
    },
    {
      id: "permissions",
      header: "Permissions",
      size: 340,
      accessorFn: (row) => row.permissions.join(" "),
      cell: ({ row }) => <PermissionBadges permissions={row.original.permissions} />,
    },
    {
      id: "usersCount",
      accessorKey: "usersCount",
      header: "Users",
      size: 70,
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.usersCount ?? "—"}</span>,
    },
    {
      id: "actions",
      header: "",
      size: 56,
      cell: ({ row }) => {
        const role = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => onView(role)}>View details</DropdownMenuItem>
                <DropdownMenuItem disabled={role.isSystem} onSelect={() => onEdit(role)}>
                  Edit role
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled={role.isSystem} variant="destructive" onSelect={() => onDelete(role)}>
                  Delete role
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableColumnFilter: false,
    },
  ];
}
