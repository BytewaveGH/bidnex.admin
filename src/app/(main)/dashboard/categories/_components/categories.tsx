"use client";
"use no memo";

import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronRight, ImageOff, Layers, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api-client";

import { CategoryServices } from "../_logics/services";
import { CategoryFormSheet } from "./category-form-sheet";
import { type FlatCategory, flattenCategories, type ICategory } from "./data";

// ── API response normalisation ────────────────────────────────────────────────

interface ApiCategoriesResponse {
  data?: ICategory[] | { data?: ICategory[] };
}

function normalise(res: ApiCategoriesResponse): ICategory[] {
  const inner = res?.data;
  if (Array.isArray(inner)) return inner;
  if (inner && !Array.isArray(inner) && Array.isArray(inner.data)) return inner.data;
  return [];
}

// ── Date formatter ────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Column factory ────────────────────────────────────────────────────────────

interface ColCallbacks {
  onEdit: (row: FlatCategory) => void;
  onDelete: (row: FlatCategory) => void;
  deletingId: number | null;
}

function makeColumns(callbacks: ColCallbacks): ColumnDef<FlatCategory>[] {
  const { onEdit, onDelete, deletingId } = callbacks;

  return [
    {
      accessorKey: "name",
      header: "Category",
      cell: ({ row }) => {
        const { name, depth, iconUrl } = row.original;
        const indent = depth * 24;
        return (
          <div className="flex items-center gap-2.5" style={{ paddingLeft: indent }}>
            {depth > 0 ? <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" /> : null}
            {/* Icon */}
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {iconUrl && (
                // biome-ignore lint/performance/noImgElement: category icon from URL
                <img src={iconUrl} alt={name} className="size-full object-contain" />
              )}
              {!iconUrl && depth === 0 && <Tag className="size-3.5 text-primary" />}
              {!iconUrl && depth !== 0 && <ImageOff className="size-3 text-muted-foreground/30" />}
            </div>
            <span className={depth === 0 ? "font-semibold text-sm" : "text-muted-foreground text-sm"}>{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "parentName",
      header: "Parent",
      cell: ({ row }) =>
        row.original.depth === 0 ? (
          <span className="text-muted-foreground text-xs italic">Top-level</span>
        ) : (
          <Badge variant="outline" className="rounded-full border-border/60 px-2 py-0 text-xs">
            {row.original.parentName}
          </Badge>
        ),
      enableSorting: false,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-muted-foreground text-sm" title={row.original.description}>
          {row.original.description ?? <span className="italic opacity-40">No description</span>}
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      header: "Created",
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-muted-foreground text-sm">{formatDate(row.original.createdAt)}</div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const isDeleting = deletingId === row.original.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="size-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              disabled={isDeleting}
              onClick={() => onDelete(row.original)}
            >
              {isDeleting ? (
                <span className="size-3.5 animate-spin rounded-full border border-destructive border-t-transparent" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
    },
  ];
}

// ── KPI cards ─────────────────────────────────────────────────────────────────

function KpiCards({ flat, isLoading }: { flat: FlatCategory[]; isLoading: boolean }) {
  const total = flat.length;
  const topLevel = flat.filter((c) => c.depth === 0).length;
  const sub = flat.filter((c) => c.depth > 0).length;

  const cards = [
    { label: "Total Categories", value: total, icon: Layers },
    { label: "Top-Level", value: topLevel, icon: Tag },
    { label: "Subcategories", value: sub, icon: ChevronRight },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="pb-1">
            <CardDescription>{label}</CardDescription>
            <CardAction>
              <Icon className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="font-semibold text-3xl leading-none tracking-tight">{value}</span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Categories() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  // ── Sheet state ────────────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<"create" | "update">("create");
  const [selectedCategory, setSelectedCategory] = React.useState<FlatCategory | null>(null);

  // ── Delete state ───────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // ── Search ─────────────────────────────────────────────────────────────────
  const [globalFilter, setGlobalFilter] = React.useState("");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const { data: raw, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const svc = CategoryServices.FetchAll();
      return apiRequest<ApiCategoriesResponse>(svc.endpoint, token);
    },
    enabled: sessionStatus === "authenticated",
    staleTime: 0,
  });

  const flat = React.useMemo(() => flattenCategories(normalise(raw ?? {})), [raw]);
  const topLevelOptions = React.useMemo(() => flat.filter((c) => c.depth === 0), [flat]);

  // ── Invalidate ─────────────────────────────────────────────────────────────
  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  // ── Create mutation ───────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: Parameters<typeof CategoryServices.Create>[0]) => {
      const svc = CategoryServices.Create(payload);
      return apiRequest(svc.endpoint, token, { method: svc.method, body: svc.body });
    },
    onSuccess: () => {
      toast.success("Category created.");
      setSheetOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create category."),
  });

  // ── Update mutation ───────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Parameters<typeof CategoryServices.Create>[0] }) => {
      const svc = CategoryServices.Update(id, payload);
      return apiRequest(svc.endpoint, token, { method: svc.method, body: svc.body });
    },
    onSuccess: () => {
      toast.success("Category updated.");
      setSheetOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update category."),
  });

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const svc = CategoryServices.Delete(id);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onMutate: (id) => setDeletingId(id),
    onSuccess: () => {
      toast.success("Category deleted.");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete category."),
    onSettled: () => setDeletingId(null),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openCreate() {
    setSelectedCategory(null);
    setSheetMode("create");
    setSheetOpen(true);
  }

  const openEdit = React.useCallback((row: FlatCategory) => {
    setSelectedCategory(row);
    setSheetMode("update");
    setSheetOpen(true);
  }, []);

  async function handleFormSubmit(payload: Parameters<typeof CategoryServices.Create>[0]) {
    if (sheetMode === "create") {
      await createMutation.mutateAsync(payload);
    } else if (selectedCategory) {
      await updateMutation.mutateAsync({ id: selectedCategory.id, payload });
    }
  }

  // ── Columns ────────────────────────────────────────────────────────────────
  const cols = React.useMemo(
    () => makeColumns({ onEdit: openEdit, onDelete: (row) => deleteMutation.mutate(row.id), deletingId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deletingId, openEdit, deleteMutation.mutate],
  );

  // ── Table ─────────────────────────────────────────────────────────────────
  const table = useReactTable({
    data: flat,
    columns: cols,
    state: { globalFilter },
    getRowId: (row) => String(row.id),
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-2xl tracking-tight">Categories</h2>
          <p className="text-muted-foreground text-sm">Manage auction item categories and subcategories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Add Category
        </Button>
      </div>

      {/* KPI cards */}
      <KpiCards flat={flat} isLoading={isLoading} />

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-none">All Categories</CardTitle>
          <CardDescription>
            {flat.length} {flat.length === 1 ? "category" : "categories"} total
          </CardDescription>
          <CardAction>
            <Input
              className="h-7 w-44 md:w-56"
              placeholder="Search categories…"
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
              }}
            />
          </CardAction>
        </CardHeader>

        <CardContent className="px-0">
          <div>
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader className="[&_tr]:border-t">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} className="py-3 font-medium text-foreground text-sm">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="py-3">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  table.getRowModel().rows.length > 0 &&
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-border/60 hover:bg-muted/30">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!isLoading && table.getRowModel().rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={cols.length} className="h-24 text-center text-muted-foreground text-sm">
                      No categories found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && flat.length > 0 && (
            <>
              <Separator />
              <div className="px-4 pt-3 text-muted-foreground text-xs">
                Showing {table.getFilteredRowModel().rows.length} of {flat.length} categories
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Form sheet */}
      <CategoryFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        initialData={selectedCategory}
        topLevelOptions={topLevelOptions}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
