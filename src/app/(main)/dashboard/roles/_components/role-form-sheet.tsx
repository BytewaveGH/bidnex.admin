"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";

import { type CreateRolePayload, RoleServices, type UpdateRolePayload } from "../_logics/services";
import { ACTION_LABELS, type IPermission, type IRole, RESOURCE_LABELS } from "./roles-table/data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalisePermissions(res: unknown): IPermission[] {
  const r = res as { data?: IPermission[] | { data?: IPermission[] } };
  const inner = r?.data;
  if (Array.isArray(inner)) return inner;
  return (inner as { data?: IPermission[] })?.data ?? [];
}

function groupByResource(permissions: IPermission[]) {
  const map = new Map<string, IPermission[]>();
  for (const p of permissions) {
    const group = map.get(p.resource) ?? [];
    group.push(p);
    map.set(p.resource, group);
  }
  // Sort by RESOURCE_LABELS order
  const order = Object.keys(RESOURCE_LABELS);
  return [...map.entries()].sort(([a], [b]) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface RoleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: IRole | null; // null = create mode
  onSuccess: () => void;
  onSubmit: (payload: CreateRolePayload | UpdateRolePayload, id?: number) => Promise<void>;
  isSubmitting: boolean;
}

export function RoleFormSheet({ open, onOpenChange, role, onSuccess: _, onSubmit, isSubmitting }: RoleFormSheetProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const isEdit = !!role;

  // ── Form state ────────────────────────────────────────────────────────────
  const [name, setName] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  // Sync form state when the role or open state changes
  React.useEffect(() => {
    if (open) {
      setName(role?.name ?? "");
      setLabel(role?.label ?? "");
      setDescription(role?.description ?? "");
      setSelected(new Set(role?.permissions ?? []));
    }
  }, [open, role]);

  // ── Fetch all permissions ─────────────────────────────────────────────────
  const { data: permissionsRaw } = useQuery({
    queryKey: ["admin-roles-permissions"],
    queryFn: () => {
      const svc = RoleServices.FetchPermissions();
      return apiRequest(svc.endpoint, token);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!token && open,
  });

  const permissions = React.useMemo(() => normalisePermissions(permissionsRaw), [permissionsRaw]);
  const grouped = React.useMemo(() => groupByResource(permissions), [permissions]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function togglePermission(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleResource(_resource: string, perms: IPermission[]) {
    const keys = perms.map((p) => p.key);
    const allSelected = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const k of keys) next.delete(k);
      } else {
        for (const k of keys) next.add(k);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const permissions = [...selected];
    if (isEdit && role) {
      await onSubmit({ label, description: description || undefined, permissions }, role.id);
    } else {
      await onSubmit({ name, label, description: description || undefined, permissions });
    }
  }

  const isSystem = role?.isSystem ?? false;
  const title = isEdit ? `Edit ${role?.label}` : "Create role";
  const submitLabel = isEdit ? "Save changes" : "Create role";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-5 pb-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update the role label, description, and permission set."
              : "Define a new role and choose its permissions."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-5 p-5">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-name">
                  System name <span className="font-normal text-muted-foreground">(snake_case, immutable)</span>
                </Label>
                <Input
                  id="role-name"
                  placeholder="e.g. finance_manager"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  disabled={isEdit}
                  required={!isEdit}
                  pattern="^[a-z][a-z0-9_]*$"
                />
              </div>

              {/* Label */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-label">Display label</Label>
                <Input
                  id="role-label"
                  placeholder="e.g. Finance Manager"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={isSystem}
                  required
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-description">
                  Description <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="role-description"
                  placeholder="What can this role do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  disabled={isSystem}
                />
              </div>

              <Separator />

              {/* Permissions picker */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>Permissions</Label>
                  <Badge variant="secondary" className="tabular-nums">
                    {selected.size} selected
                  </Badge>
                </div>

                {grouped.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Loading permissions…</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {grouped.map(([resource, perms]) => {
                      const keys = perms.map((p) => p.key);
                      const allChecked = keys.every((k) => selected.has(k));
                      const someChecked = !allChecked && keys.some((k) => selected.has(k));

                      return (
                        <div key={resource} className="overflow-hidden rounded-lg border border-border/60">
                          {/* Resource header */}
                          <button
                            type="button"
                            onClick={() => !isSystem && toggleResource(resource, perms)}
                            className="flex w-full items-center gap-2.5 bg-muted/40 px-3 py-2 text-left"
                            disabled={isSystem}
                          >
                            <Checkbox
                              checked={allChecked}
                              ref={(el) => {
                                if (el)
                                  (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someChecked;
                              }}
                              className="pointer-events-none"
                              tabIndex={-1}
                            />
                            <span className="font-medium text-sm">{RESOURCE_LABELS[resource] ?? resource}</span>
                          </button>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 py-2.5">
                            {perms.map((p) => (
                              <label
                                key={p.key}
                                htmlFor={`perm-${p.key}`}
                                className={`flex items-center gap-1.5 text-sm ${isSystem ? "cursor-default opacity-70" : "cursor-pointer"}`}
                              >
                                <Checkbox
                                  id={`perm-${p.key}`}
                                  checked={selected.has(p.key)}
                                  onCheckedChange={() => !isSystem && togglePermission(p.key)}
                                  disabled={isSystem}
                                />
                                {ACTION_LABELS[p.action] ?? p.action}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="gap-2 border-t px-5 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isSystem}>
              {isSubmitting ? "Saving…" : submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
