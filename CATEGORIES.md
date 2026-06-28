# Categories — CRUD Flow

This document describes how categories are fetched, created, updated, and deleted in the admin panel.

---

## Overview

Categories support **two levels**: top-level categories and subcategories (one level of nesting). The backend returns the full tree in a single request. The admin panel flattens it client-side for display in the AG Grid, preserving visual hierarchy via indentation.

All requests go through `apiClient` with auth headers injected automatically (see [LOGIN.md](LOGIN.md) §6).

---

## API Endpoints

**File:** [`src/app/[locale]/(stores)/admin/categories/_logics/services.ts`](src/app/[locale]/(stores)/admin/categories/_logics/services.ts)

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/admin/categories` | Fetch full category tree |
| `POST` | `/admin/categories` | Create a new category |
| `PUT` | `/admin/categories/:id` | Update an existing category |
| `DELETE` | `/admin/categories/:id` | Delete a category |

---

## Viewing — `GET /admin/categories`

**Hook:** `useFetchData` (non-paginated, from [`src/hooks/use-fetch.ts`](src/hooks/use-fetch.ts))

```ts
const { data: categoriesRaw, isLoading, refetch } = useFetchData(
  'admin-categories',
  CategoryServices.FetchAll()
)
```

- Cache key `'admin-categories'` is static — no filters, no pagination.
- Only runs when session is authenticated.
- `staleTime: 0` — always re-fetches on mount.
- Retries up to 2× with exponential backoff on failure.

### Response shape

The backend returns a nested tree:

```ts
interface ICategory {
  id: number
  name: string
  slug: string
  description?: string
  iconUrl?: string
  parentId?: number | null
  children?: ICategory[]   // subcategories nested here
  createdAt: string
}
```

### Client-side flattening

The tree is flattened into a flat list for the AG Grid using `flattenCategories()`:

```ts
type FlatCategory = ICategory & { depth: number; parentName: string | null }

const flattenCategories = (cats, depth = 0, parentName = null) =>
  cats.flatMap((cat) => [
    { ...cat, depth, parentName },
    ...flattenCategories(cat.children ?? [], depth + 1, cat.name),
  ])
```

- `depth === 0` → top-level category (bold, blue icon)
- `depth > 0` → subcategory (indented by `depth * 24px`, chevron prefix)
- `parentName` → displayed in the "Parent" column as a badge

The grid renders up to 200 rows without pagination (all categories shown at once).

---

## Creating — `POST /admin/categories`

1. User clicks **Add Category** → side sheet opens in `create` mode.
2. `CategoryForm` is rendered with `mode='create'` and no `initialData`.
3. On submit, client-side validation runs:
   - `name` — required, non-empty.
   - `iconUrl` — optional, but if provided must match `^https?:\/\/.+`.
4. Payload sent:

```ts
// POST /admin/categories
{
  name: string           // required
  description?: string   // omitted if empty
  iconUrl?: string       // omitted if empty; must be a valid http/https URL
  parentId: number | null  // null → top-level; number → subcategory of that parent
}
```

5. On success: toast shown, sheet closed, `refetch()` reloads the grid.

**Parent options** available in the dropdown are all current top-level categories (`depth === 0`). This enforces maximum one level of nesting.

---

## Updating — `PUT /admin/categories/:id`

1. User clicks the **edit (pencil) button** on any row → sheet opens in `update` mode.
2. `CategoryForm` is pre-populated with the row's current data via `initialData`.
3. Same validation as create.
4. Payload sent (same shape as create, all fields):

```ts
// PUT /admin/categories/:id
{
  name: string
  description?: string
  iconUrl?: string
  parentId: number | null
}
```

5. The category being edited is **excluded from its own parent options** (can't make itself its own parent):

```ts
parentOptions={topLevelOptions.filter((o) => o.id !== selectedCategory.id)}
```

6. On success: toast shown, sheet closed, `refetch()` reloads the grid.

---

## Deleting — `DELETE /admin/categories/:id`

1. User clicks the **trash button** on any row.
2. No confirmation dialog — delete fires immediately.
3. The row's button shows a disabled/loading state (`deletingId === row.id`) while the request is in flight.

```ts
// DELETE /admin/categories/:id
// No body.
```

4. On success: toast shown, `refetch()` reloads the grid.
5. On failure: error toast shown, grid unchanged.

> **Note:** There is no soft-delete or undo. Deleting a parent category with children may behave differently depending on the backend (cascade delete or rejection) — the admin UI does not warn the user beforehand.

---

## Form Fields Reference

**File:** [`src/app/[locale]/(stores)/admin/categories/_widgets/_forms/category-form.tsx`](src/app/[locale]/(stores)/admin/categories/_widgets/_forms/category-form.tsx)

| Field | Required | Validation | Notes |
|---|---|---|---|
| `name` | Yes | Non-empty | Must be unique (enforced by backend) |
| `description` | No | None | Omitted from payload if empty |
| `iconUrl` | No | Must start with `http://` or `https://` | Live preview shown below input when valid |
| `parentId` | No | None | Dropdown of top-level categories; empty = top-level |

---

## State Flow

```
useFetchData('admin-categories')
  → GET /admin/categories
  → flattenCategories(raw)
  → rendered in AG Grid

[Add Category]          → sheetOpen=true, selectedCategory=null  → CategoryForm mode='create'
[Edit row]              → sheetOpen=true, selectedCategory=row   → CategoryForm mode='update'
[Delete row]            → DELETE /admin/categories/:id → refetch()

CategoryForm onSuccess  → closeSheet() + refetch()
```

---

## Key Files Reference

| File | Role |
|---|---|
| [`src/app/[locale]/(stores)/admin/categories/_logics/services.ts`](src/app/[locale]/(stores)/admin/categories/_logics/services.ts) | All endpoint definitions |
| [`src/app/[locale]/(stores)/admin/categories/_widgets/main.tsx`](src/app/[locale]/(stores)/admin/categories/_widgets/main.tsx) | Page component — fetch, grid, sheet, delete logic |
| [`src/app/[locale]/(stores)/admin/categories/_widgets/_forms/category-form.tsx`](src/app/[locale]/(stores)/admin/categories/_widgets/_forms/category-form.tsx) | Create/update form with validation |
| [`src/hooks/use-fetch.ts`](src/hooks/use-fetch.ts) | Non-paginated fetch hook used to load categories |
| [`src/hooks/use-axios.ts`](src/hooks/use-axios.ts) | Imperative request hook used for create, update, delete |
| [`src/types/interfaces/gems-bid.ts`](src/types/interfaces/gems-bid.ts) | `ICategory`, `ICategoryPayload` type definitions |
