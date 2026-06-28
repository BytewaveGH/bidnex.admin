"use client";
"use no memo";

import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";

import { CategoriesSection } from "./_components/categories-section";
import { CategoryFormSheet } from "./_components/category-form-sheet";
import { CategoryKpiCards } from "./_components/category-kpi-cards";
import { type FlatCategory, flattenCategories, type ICategory } from "./_components/data";
import { CategoryServices } from "./_logics/services";

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Page() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  // ── Sheet state ──────────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetMode, setSheetMode] = React.useState<"create" | "update">("create");
  const [selectedCategory, setSelectedCategory] = React.useState<FlatCategory | null>(null);

  // ── Delete state ─────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
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

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  // ── Mutations ────────────────────────────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openCreate() {
    setSelectedCategory(null);
    setSheetMode("create");
    setSheetOpen(true);
  }

  function openEdit(row: FlatCategory) {
    setSelectedCategory(row);
    setSheetMode("update");
    setSheetOpen(true);
  }

  async function handleFormSubmit(payload: Parameters<typeof CategoryServices.Create>[0]) {
    if (sheetMode === "create") {
      await createMutation.mutateAsync(payload);
    } else if (selectedCategory) {
      await updateMutation.mutateAsync({ id: selectedCategory.id, payload });
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Derived KPI values ────────────────────────────────────────────────────
  const total = flat.length;
  const topLevel = flat.filter((c) => c.depth === 0).length;
  const subcategories = flat.filter((c) => c.depth > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl tracking-tight">Categories</h2>
          <p className="text-muted-foreground text-sm">Manage auction item categories and subcategories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Add Category
        </Button>
      </div>

      <CategoryKpiCards total={total} topLevel={topLevel} subcategories={subcategories} />

      <CategoriesSection
        data={flat}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => deleteMutation.mutate(row.id)}
        deletingId={deletingId}
      />

      <CategoryFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        initialData={selectedCategory}
        topLevelOptions={topLevelOptions}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
