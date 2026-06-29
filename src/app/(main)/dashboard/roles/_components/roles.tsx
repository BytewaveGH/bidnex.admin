"use client";
"use no memo";

import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api-client";

import { type CreateRolePayload, RoleServices, type UpdateRolePayload } from "../_logics/services";
import { RoleDetailSheet } from "./role-detail-sheet";
import { RoleFormSheet } from "./role-form-sheet";
import { makeRolesColumns } from "./roles-table/columns";
import type { IRole } from "./roles-table/data";
import { RolesTable } from "./roles-table/table";

// ── Helpers ───────────────────────────────────────────────────────────────────

interface ApiRolesResponse {
  data?: IRole[] | { data?: IRole[]; count?: number };
}

function normalise(res: ApiRolesResponse): { roles: IRole[]; total: number } {
  const inner = res.data;
  if (Array.isArray(inner)) return { roles: inner, total: inner.length };
  const roles = inner?.data ?? [];
  const total = inner?.count ?? roles.length;
  return { roles, total };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Roles() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  // ── Sheet / dialog state ──────────────────────────────────────────────────
  const [formSheetOpen, setFormSheetOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<IRole | null>(null);
  const [detailRole, setDetailRole] = React.useState<IRole | null>(null);
  const [deleteRole, setDeleteRole] = React.useState<IRole | null>(null);

  // ── Table filter state ────────────────────────────────────────────────────
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 12 });

  // ── Fetch roles ───────────────────────────────────────────────────────────
  const { data: raw, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => {
      const svc = RoleServices.FetchAll();
      return apiRequest<ApiRolesResponse>(svc.endpoint, token);
    },
    enabled: sessionStatus === "authenticated",
    staleTime: 0,
  });

  const { roles } = React.useMemo(() => normalise(raw ?? {}), [raw]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
  }

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(payload: CreateRolePayload | UpdateRolePayload, id?: number) {
    setIsSubmitting(true);
    try {
      if (id !== undefined) {
        const svc = RoleServices.Update(id, payload as UpdateRolePayload);
        await apiRequest(svc.endpoint, token, { method: svc.method, body: svc.body });
        toast.success("Role updated.");
      } else {
        const svc = RoleServices.Create(payload as CreateRolePayload);
        await apiRequest(svc.endpoint, token, { method: svc.method, body: svc.body });
        toast.success("Role created.");
      }
      setFormSheetOpen(false);
      setEditingRole(null);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (role: IRole) => {
      const svc = RoleServices.Delete(role.id);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onSuccess: (_, role) => {
      toast.success(`"${role.label}" deleted.`);
      setDeleteRole(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete role."),
  });

  // ── Column callbacks ──────────────────────────────────────────────────────

  const columns = React.useMemo(
    () =>
      makeRolesColumns({
        onView: (role) => setDetailRole(role),
        onEdit: (role) => {
          setEditingRole(role);
          setFormSheetOpen(true);
        },
        onDelete: (role) => setDeleteRole(role),
      }),
    [],
  );

  // ── Table ─────────────────────────────────────────────────────────────────

  const table = useReactTable({
    data: roles,
    columns,
    defaultColumn: { size: 140, minSize: 80, maxSize: 420 },
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    initialState: {
      columnVisibility: { group: false, search: false },
    },
  });

  const search = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const groupFilter = (table.getColumn("group")?.getFilterValue() as string) ?? "";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl tracking-tight">Roles & Permissions</h1>
            <p className="text-muted-foreground text-sm">
              Manage access roles and permissions across your organization.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingRole(null);
              setFormSheetOpen(true);
            }}
          >
            Create role
          </Button>
        </div>

        <Tabs className="h-full gap-4" defaultValue="roles">
          <TabsList
            variant="line"
            className="w-full justify-start gap-2 border-b ps-0 *:data-[slot=tabs-trigger]:flex-none"
          >
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
                <div className="flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <InputGroup className="h-7 w-full rounded-md sm:w-82">
                    <InputGroupAddon>
                      <Search />
                    </InputGroupAddon>
                    <InputGroupInput
                      className="h-7"
                      placeholder="Search roles…"
                      value={search}
                      onChange={(e) => {
                        table.getColumn("search")?.setFilterValue(e.target.value || undefined);
                        table.setPageIndex(0);
                      }}
                    />
                  </InputGroup>

                  <Select
                    value={groupFilter || "All"}
                    onValueChange={(v) => {
                      table.getColumn("group")?.setFilterValue(v === "All" ? undefined : v);
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">Type:</span>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      <SelectGroup>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="System roles">System</SelectItem>
                        <SelectItem value="Custom roles">Custom</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                    Loading roles…
                  </div>
                ) : (
                  <RolesTable table={table} />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create / Edit sheet */}
      <RoleFormSheet
        open={formSheetOpen}
        onOpenChange={(open) => {
          setFormSheetOpen(open);
          if (!open) setEditingRole(null);
        }}
        role={editingRole}
        onSuccess={invalidate}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Detail sheet */}
      <RoleDetailSheet
        open={!!detailRole}
        onOpenChange={(open) => {
          if (!open) setDetailRole(null);
        }}
        role={detailRole}
      />

      {/* Delete confirm dialog */}
      <AlertDialog
        open={!!deleteRole}
        onOpenChange={(open) => {
          if (!open) setDeleteRole(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteRole?.label}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the role and unassign it from all users. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteRole && deleteMutation.mutate(deleteRole)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
