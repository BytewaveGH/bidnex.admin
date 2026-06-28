# Users — Fetch & Data Flow

This document describes how the Users page fetches, filters, paginates, and mutates user data.

---

## Overview

The Users page uses **server-side pagination** via `useFetchPaginated`. Filters (account type, status, search) are applied as query params sent to the backend — no client-side filtering. React Query caches each unique filter combination under its own key.

All requests are made through the `apiClient` Axios instance which automatically attaches:

```
Authorization:   Bearer {accessToken}
X-Tenant-Domain: admin
Cache-Control:   no-cache
```

See [LOGIN.md](LOGIN.md) §6 for how auth headers are injected.

---

## API Endpoints

**File:** [`src/app/[locale]/(stores)/admin/users/_logics/services.ts`](<src/app/[locale]/(stores)/admin/users/_logics/services.ts>)

| Method | Endpoint                         | Purpose                   |
| ------ | -------------------------------- | ------------------------- |
| `GET`  | `/admin/users`                   | Fetch paginated user list |
| `GET`  | `/admin/users/:id`               | Fetch single user by ID   |
| `PUT`  | `/admin/users/:id/suspend`       | Suspend a user            |
| `PUT`  | `/admin/users/:id/activate`      | Activate a suspended user |
| `POST` | `/admin/users/:id/wallet/credit` | Credit a user's wallet    |

---

## Fetch All Users — `GET /admin/users`

### Query params

| Param         | Type                              | When sent                                    |
| ------------- | --------------------------------- | -------------------------------------------- |
| `accountType` | `'bidder' \| 'vendor' \| 'admin'` | When a type filter is active                 |
| `status`      | `'active' \| 'suspended'`         | When a status filter is active               |
| `search`      | `string`                          | When the search box is committed (Enter key) |
| `limit`       | `number`                          | Always — current page size (20 / 50 / 100)   |
| `offset`      | `number`                          | Always — `page * pageSize`                   |

### Hook: `useFetchPaginated`

**File:** [`src/hooks/use-fetch-paginated.ts`](src/hooks/use-fetch-paginated.ts)

```ts
const { data: users, total, isLoading, refetch } = useFetchPaginated(
  queryKey,          // cache key — changes when any filter changes
  UserAdminServices.FetchAll({ accountType?, status?, search? }),
  page,
  pageSize
)
```

- Built on **TanStack Query** (`useQuery`).
- Only runs when the session `status === 'authenticated'` — safe against unauthenticated calls.
- Uses `keepPreviousData` so the grid stays populated while a new page loads.
- `staleTime: 0` — always re-fetches on mount (no stale cache served).
- `refetchOnWindowFocus: false` — no background refetch on tab focus.

### Response shape expected

```ts
// Preferred (paginated envelope)
{ data: { data: IAdminUser[], count: number } }

// Fallback (plain array)
{ data: IAdminUser[] }
```

The hook normalises both shapes and returns `{ data: IAdminUser[], total: number }`.

### Cache key strategy

```ts
const queryKey = `admin-users-${accountTypeFilter}-${statusFilter}-${search}`
// queryKey changes → React Query treats it as a new query → fresh fetch
```

Changing any filter resets `page` to `0` and issues a new fetch.

---

## Types

**File:** [`src/types/interfaces/gems-bid.ts`](src/types/interfaces/gems-bid.ts)

```typescript
type UserAccountType = 'bidder' | 'vendor' | 'admin'

interface IAdminUser {
  id: number
  username: string
  email: string
  phone?: string
  accountType: UserAccountType
  isVerified: boolean
  status: 'active' | 'suspended'
  createdAt: string
}

interface IWalletCreditPayload {
  amount: number // must be > 0
  description: string // required, audit trail
}
```

---

## Pagination

Pagination is handled **manually** (AG Grid's built-in pagination is disabled). The `Pagination` component in [`src/app/[locale]/(stores)/admin/users/_widgets/main.tsx`](<src/app/[locale]/(stores)/admin/users/_widgets/main.tsx>) renders prev/next controls and a page-size selector (20 / 50 / 100).

- `page` and `pageSize` are local state, passed as `offset` / `limit` to the query.
- Changing `pageSize` resets `page` to `0`.

---

## Filters

Three independent filters — all reset `page` to `0` on change:

| Filter       | State var           | Values                                  |
| ------------ | ------------------- | --------------------------------------- |
| Account type | `accountTypeFilter` | `'' \| 'bidder' \| 'vendor' \| 'admin'` |
| Status       | `statusFilter`      | `'' \| 'active' \| 'suspended'`         |
| Search       | `search`            | free text — committed on **Enter**      |

`searchInput` is the live input value; `search` is only updated on Enter (avoids a fetch per keystroke).

---

## Vendor Lots (side panel)

For vendor rows an extra "Lots" button opens a side sheet. It uses `useFetchData` (non-paginated):

**File:** [`src/hooks/use-fetch.ts`](src/hooks/use-fetch.ts)

```ts
useFetchData(`vendor-lots-${vendor.id}`, LotServices.FetchByVendor(vendor.id))
```

- Same auth headers, same `apiClient`.
- Retries up to 2× with exponential backoff (1 s → 2 s → capped at 30 s).

```typescript
type LotReviewStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
type LotBiddingStatus = 'pending' | 'active' | 'sold' | 'unsold' | 'cancelled'

interface ILot {
  id: number
  vendorId: number
  vendorName?: string
  title: string
  description?: string
  condition?: string
  startingBid: number
  reservePrice?: number
  currentBid?: number
  currentBidCount?: number
  reviewStatus: LotReviewStatus
  reviewRejectReason?: string
  status: LotBiddingStatus
  auctionId?: number | null
  primaryImage?: string
  lotOrder?: number
  bidStartTime?: string
  bidEndTime?: string
  createdAt: string
}
```

---

## Mutations

All mutations use `useAxios` — a thin wrapper that returns a function calling `apiClient` directly.

**File:** [`src/hooks/use-axios.ts`](src/hooks/use-axios.ts)

```ts
const request = useAxios()
await request(UserAdminServices.Suspend(user.id)) // PUT /admin/users/:id/suspend
await request(UserAdminServices.Activate(user.id)) // PUT /admin/users/:id/activate
await request(UserAdminServices.CreditWallet(id, { amount, description }))
```

After every mutation `refetch()` is called to reload the current page.

### Wallet credit payload

```ts
// POST /admin/users/:id/wallet/credit
{
  amount: number // must be > 0
  description: string // required, non-empty
}
```

---

## Key Files Reference

| File                                                                                                                       | Role                                                          |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`src/app/[locale]/(stores)/admin/users/_logics/services.ts`](<src/app/[locale]/(stores)/admin/users/_logics/services.ts>) | All endpoint definitions for users                            |
| [`src/app/[locale]/(stores)/admin/users/_widgets/main.tsx`](<src/app/[locale]/(stores)/admin/users/_widgets/main.tsx>)     | Page component — state, filters, grid, modals                 |
| [`src/hooks/use-fetch-paginated.ts`](src/hooks/use-fetch-paginated.ts)                                                     | Paginated fetch hook (TanStack Query)                         |
| [`src/hooks/use-fetch.ts`](src/hooks/use-fetch.ts)                                                                         | Non-paginated fetch hook (vendor lots)                        |
| [`src/hooks/use-axios.ts`](src/hooks/use-axios.ts)                                                                         | Imperative request hook for mutations                         |
| [`src/lib/axios-client.ts`](src/lib/axios-client.ts)                                                                       | Axios instance — attaches auth headers, handles 401           |
| [`src/types/interfaces/gems-bid.ts`](src/types/interfaces/gems-bid.ts)                                                     | `IAdminUser`, `IWalletCreditPayload`, `ILot` type definitions |
