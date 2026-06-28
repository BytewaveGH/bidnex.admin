# Bidnex Admin — Logic Specification

> **Purpose:** This document describes all business logic, data models, API contracts, and architectural patterns of the Bidnex Admin dashboard. Use it to recreate the same logic in a new project while keeping the new project's own UI.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure Conventions](#2-project-structure-conventions)
3. [Environment Variables](#3-environment-variables)
4. [Authentication Flow](#4-authentication-flow)
5. [HTTP Client & Token Refresh](#5-http-client--token-refresh)
6. [Internationalization](#6-internationalization)
7. [State Management](#7-state-management)
8. [Data Models](#8-data-models)
9. [API Endpoints](#9-api-endpoints)
10. [Page Logic & Features](#10-page-logic--features)
11. [Custom Hooks](#11-custom-hooks)
12. [Routing & Middleware](#12-routing--middleware)
13. [Error Handling](#13-error-handling)
14. [Key Business Rules](#14-key-business-rules)

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict) |
| Auth | next-auth v5 beta (JWT strategy) |
| HTTP Client | Axios with request/response interceptors |
| Server State | TanStack React Query v5 |
| Client State | Zustand v5 |
| Forms | React Hook Form + Zod |
| Data Grid | AG Grid (ag-grid-react) |
| Charts | AG Charts (ag-charts-react) |
| i18n | next-intl (en, fr) |
| Styling | Tailwind CSS + CVA + Radix UI primitives |
| Notifications | Sonner |
| Icons | Lucide React |
| Encryption | crypto-js |

---

## 2. Project Structure Conventions

```
src/
├── app/[locale]/
│   ├── (auth)/               # Login page (unauthenticated)
│   └── (stores)/admin/       # Protected admin pages
│       ├── dashboard/
│       ├── auctions/
│       ├── lots/
│       ├── categories/
│       ├── users/
│       ├── finance/
│       └── disputes/
├── components/
│   ├── ui/                   # Primitive wrappers (Button, Input, etc.)
│   ├── templates/            # Composite components (DataGrid, Chart wrappers)
│   └── generals/
│       ├── authentication/   # SignIn form
│       ├── layouts/          # Main layout (sidebar + topnav)
│       └── providers/        # NextAuth, ReactQuery, SessionBridge
├── hooks/                    # Custom React hooks
├── lib/                      # axios-client, session-store, utilities
├── types/                    # TypeScript interfaces (gems-bid.ts, next-auth.d.ts)
└── zustand/                  # Global store

# Per-page pattern inside (stores)/admin/{page}/
├── page.tsx                  # Minimal route wrapper
├── _widgets/
│   ├── main.tsx              # Page root component (data fetch + layout)
│   └── _forms/               # Form components for that page
└── _logics/
    └── services.ts           # API call config builders for that page
```

---

## 3. Environment Variables

| Variable | Visibility | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Public (browser) | Backend API base URL |
| `BETTER_AUTH_SECRET` | Server only | JWT signing secret (NextAuth) |
| `TENANT_DOMAIN` | Server only | Tenant identifier sent as `X-Tenant-Domain` header (defaults to `"admin"`) |

---

## 4. Authentication Flow

### Login

1. User submits email + password on the sign-in page.
2. `signIn('credentials', { email, password })` is called (NextAuth).
3. Credential provider validates schema, then calls:

```
POST /auth/admin-login
Headers: { X-Tenant-Domain: "admin" }
Body:    { email, password }
```

4. Backend returns `IAuth.Response` (see [Data Models](#8-data-models)).
5. NextAuth JWT callback stores in token:
   - `userId`, `username`, `accountType`, `avatar`, `phone`, `email`, `tenant`
   - `accessToken`, `refreshToken`
   - `accessTokenExpiry`, `refreshTokenExpiry` — converted to **absolute Unix timestamps (ms)**
   - `exp` set to `refreshTokenExpiry` so the session lives as long as the refresh token
6. Session callback copies all token fields to `session.user`.
7. Middleware redirects authenticated users to `/[locale]/admin/dashboard`.

### Token Refresh (automatic)

The JWT callback checks on every `getSession()` call:

- If `accessTokenExpiry - now < 5 minutes` → call refresh endpoint:

```
POST /auth/refresh
Headers: { X-Refresh-Token: {refreshToken}, X-Tenant-Domain: "admin" }
Body:    {}
```

- New tokens stored back into the JWT.
- If refresh fails → token gains `error: "RefreshAccessTokenError"`.

### Session Termination

A `RefreshTokenHandler` component (mounted globally) watches `session.user.error`. When it equals `"RefreshAccessTokenError"`, it calls `signOut({ callbackUrl: "/[locale]" })` and the user lands back on the login page.

### Session Bridge (for non-React code)

`/src/lib/session-store.ts` exposes `getSessionSync()` and `waitForSession()` so the Axios interceptor (which runs outside React) can read the current access token synchronously.

A `SessionBridge` component (mounted inside the auth provider) calls `setSession(session)` to keep the store in sync with NextAuth.

---

## 5. HTTP Client & Token Refresh

**File:** `/src/lib/axios-client.ts`

```
Base URL:    process.env.NEXT_PUBLIC_API_URL
Timeout:     (default axios)
```

### Request Interceptor

Injects headers on every outgoing request:
```
Authorization:   Bearer {accessToken}
X-Tenant-Domain: {tenant}
Content-Type:    application/json   (or multipart/form-data for file uploads)
Cache-Control:   no-cache
```

### Response Interceptor

On `401` response:
1. Pauses all concurrent requests (queues them).
2. Calls `getSession()` — NextAuth JWT callback auto-refreshes the token.
3. After refresh, drains the queue — retries each original request with the new token.
4. If refresh itself fails, rejects all queued requests and redirects to login.

---

## 6. Internationalization

- **Locales:** `en` (default), `fr`
- **Prefix:** Always present — every URL starts with `/en/` or `/fr/`.
- **Message files:** `/messages/en.json`, `/messages/fr.json`
- **Config:** `/src/i18n/routing.ts` — uses `next-intl` with `createNavigation()`.
- Middleware applies i18n after the auth check.

---

## 7. State Management

### React Query (server state — primary pattern)

- `refetchOnWindowFocus: false` globally.
- Query keys include the entity name + filter params (e.g., `"admin-analytics-2024-01-01-2024-01-31"`).
- Pagination uses limit/offset; `useFetchPaginated` hook handles both array and object (`{data[], total}`) response shapes.

### Zustand (client state — minimal)

Single generic store (`useGeneralStore`) with:
```typescript
zusState: T
zusUpdateState: (key, value) => void
```
Used sparingly for page-level UI state that doesn't belong in React Query.

### Local Storage

User preferences stored via `useBrowserStorage` hook. Example: dashboard budget settings stored under key `gbid_budgets`.

---

## 8. Data Models

### Auth

```typescript
namespace IAuth {
  interface Response {
    accessToken: string
    refreshToken: string
    accessTokenExpiry: number   // seconds or absolute timestamp — normalize to absolute ms
    refreshTokenExpiry: number
    user: {
      id: number
      username: string
      accountType: string       // 'admin'
      avatar: string
      phone: string
      email: string
      createdAt: string
      updatedAt: string
    }
  }
}
```

### Analytics

```typescript
namespace IAnalytics {
  interface Kpis {
    totalRevenue: number
    revenueChange: number        // % vs previous period
    activeAuctions: number
    bidsToday: number
    openDisputes: number
    totalUsers: number
  }
  interface DailyPoint   { date: string; revenue: number; bids: number }
  interface MonthlyPoint { month: string; revenue: number; bids: number }
  interface HourlyPoint  { hour: number; revenue: number; bids: number }  // hour 0-23
  interface HeatmapPoint { day: number; hour: number; bids: number }       // day 0-6 (Sun-Sat)
  interface PaymentMethod { method: string; amount: number; pct: number }
  interface PaymentsResponse { total: number; methods: PaymentMethod[] }

  interface TopLot {
    id: number; title: string; startingBid: number; currentBid: number
    bidCount: number; margin: number; status: string
    auctionId?: number; auctionTitle?: string
  }
  interface AuctionPerf {
    id: number; title: string; revenue: number
    lotsCount: number; soldCount: number; bidCount: number
  }
  interface ActionsNeeded {
    pendingAuctions: number; pendingLots: number; openDisputes: number
  }
  interface Insights {
    revenueVsPrevPeriod: number   // %
    avgBidsPerLot: number
    disputeRate: number           // %
    topAuction: string
    topAuctionRevenue: number
    peakHour: number              // 0-23
    newUsersInPeriod: number
  }
  interface UnifiedResponse {
    kpis: Kpis
    dailyRevenue: DailyPoint[]
    monthlyRevenue: MonthlyPoint[]
    hourlyActivity: HourlyPoint[]
    heatmap: HeatmapPoint[]
    topLots: TopLot[]
    auctionPerformance: AuctionPerf[]
    actionsNeeded: ActionsNeeded
    insights: Insights
  }
}
```

### Auctions

```typescript
type AuctionStatus = 'draft' | 'pending_review' | 'active' | 'ended' | 'cancelled'

interface IAuction {
  id: number
  title: string
  description?: string
  status: AuctionStatus
  vendorId: number
  vendorName?: string
  isFeatured: boolean
  startTime?: string
  endTime?: string
  lotInterval?: number       // minutes between lots
  lotCount?: number
  rejectReason?: string
  locationName?: string
  locationAddress?: string
  createdAt: string
}

interface IAuctionCreatePayload {
  title: string
  description?: string
  locationName?: string
  locationAddress?: string
  startTime: string
  endTime: string
  isFeatured?: boolean
}

interface IAuctionSchedulePayload {
  startTime: string
  lotIntervalMinutes: number
}
```

### Lots

```typescript
type LotReviewStatus   = 'draft' | 'submitted' | 'approved' | 'rejected'
type LotBiddingStatus  = 'pending' | 'active' | 'sold' | 'unsold' | 'cancelled'

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

### Categories

```typescript
interface ICategory {
  id: number
  name: string
  slug: string
  description?: string
  iconUrl?: string
  parentId?: number | null
  children?: ICategory[]
  createdAt: string
}

interface ICategoryPayload {
  name: string
  description?: string
  iconUrl?: string
  parentId?: number | null
}
```

### Users

```typescript
type UserAccountType = 'bidder' | 'vendor' | 'admin'

interface IAdminUser {
  id: number
  username: string
  email: string
  phone?: string
  accountType: UserAccountType
  isVerified: boolean
  createdAt: string
}

interface IWalletCreditPayload {
  amount: number
  description: string
}
```

### Disputes

```typescript
type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'resolved_refund'
  | 'resolved_partial'
  | 'resolved_store_credit'
  | 'resolved_no_action'
  | 'closed'

type DisputeResolutionStatus = Exclude<DisputeStatus, 'open' | 'under_review'>

interface IDisputeMessage {
  id: number
  disputeId: number
  senderId: number
  message: string
  attachments: string[]
  createdAt: string
}

interface IDispute {
  id: number
  lotId: number
  buyerId: number
  sellerId: number
  reason: string
  description: string
  status: DisputeStatus
  outcomeNote?: string
  filedAt: string
  resolvedAt?: string
  messages?: IDisputeMessage[]
}

interface IDisputeResolvePayload {
  status: DisputeResolutionStatus
  outcomeNote?: string
}
```

### Finance

```typescript
type PayoutStatus = 'completed' | 'failed' | 'pending_review'

interface IFinanceStats {
  totalVolume: number
  totalPlatformFees: number
  totalTransferred: number
  totalPayouts: number
  successfulPayouts: number
  failedPayouts: number
  pendingReview: number
}

interface IPayout {
  id: number
  lotId: number
  lotTitle: string
  vendorId: number
  vendorName?: string
  grossAmount: number
  platformCharge: number
  transferAmount: number     // grossAmount - platformCharge
  status: PayoutStatus
  failureReason?: string
  moolreReference?: string   // external payment reference
  createdAt: string
}
```

---

## 9. API Endpoints

All requests include:
```
Authorization:   Bearer {accessToken}
X-Tenant-Domain: admin
Content-Type:    application/json
Cache-Control:   no-cache
```

### Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/admin-login` | `{ email, password }` | `IAuth.Response` |
| POST | `/auth/refresh` | `{}` + header `X-Refresh-Token` | `IAuth.Response` |

---

### Analytics

| Method | Path | Query Params | Response |
|---|---|---|---|
| GET | `/admin/analytics` | `from`, `to` (YYYY-MM-DD) | `IAnalytics.UnifiedResponse` |
| GET | `/admin/analytics/payments` | `from`, `to` | `IAnalytics.PaymentsResponse` |

---

### Auctions

| Method | Path | Params / Body | Response |
|---|---|---|---|
| GET | `/admin/auctions` | `status`, `limit`, `offset`, `dateFrom`, `dateTo` | `IAuction[]` |
| GET | `/admin/auctions/:id` | — | `IAuction` |
| POST | `/admin/auctions` | `IAuctionCreatePayload` | `IAuction` |
| PUT | `/admin/auctions/:id` | `Partial<IAuctionCreatePayload>` | `IAuction` |
| PUT | `/admin/auctions/:id/approve` | — | `IAuction` |
| PUT | `/admin/auctions/:id/reject` | `{ reason: string }` | `IAuction` |
| PUT | `/admin/auctions/:id/cancel` | — | `IAuction` |
| PUT | `/admin/auctions/:id/schedule` | `IAuctionSchedulePayload` | `IAuction` |
| GET | `/admin/auctions/:id/lots` | — | `ILot[]` |
| POST | `/admin/auctions/:auctionId/lots/:lotId` | — | success |
| DELETE | `/admin/auctions/:auctionId/lots/:lotId` | — | success |

---

### Lots

| Method | Path | Params / Body | Response |
|---|---|---|---|
| GET | `/admin/lots` | `vendorId`, `status`, `limit`, `offset` | `ILot[]` |
| GET | `/admin/lots/:id` | — | `ILot` |
| PUT | `/admin/lots/:id/approve` | — | `ILot` |
| PUT | `/admin/lots/:id/reject` | `{ reason: string }` | `ILot` |

---

### Categories

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/admin/categories` | — | `ICategory[]` |
| POST | `/admin/categories` | `ICategoryPayload` | `ICategory` |
| PUT | `/admin/categories/:id` | `Partial<ICategoryPayload>` | `ICategory` |
| DELETE | `/admin/categories/:id` | — | 200/204 |

---

### Users

| Method | Path | Params / Body | Response |
|---|---|---|---|
| GET | `/admin/users` | `accountType`, `isVerified`, `limit`, `offset` | `IAdminUser[]` |
| GET | `/admin/users/:id` | — | `IAdminUser` |
| PUT | `/admin/users/:id/suspend` | — | `IAdminUser` |
| PUT | `/admin/users/:id/activate` | — | `IAdminUser` |
| POST | `/admin/users/:id/wallet/credit` | `IWalletCreditPayload` | updated user |
| GET | `/admin/vendors/:vendorId/payouts` | `limit`, `offset` | `IPayout[]` |

---

### Disputes

| Method | Path | Params / Body | Response |
|---|---|---|---|
| GET | `/admin/disputes` | `status`, `limit`, `offset`, `dateFrom`, `dateTo` | `IDispute[]` |
| GET | `/admin/disputes/:id` | — | `IDispute` (includes `messages[]`) |
| PUT | `/admin/disputes/:id/resolve` | `IDisputeResolvePayload` | `IDispute` |

---

### Finance

| Method | Path | Params | Response |
|---|---|---|---|
| GET | `/admin/finance/stats` | — | `IFinanceStats` |
| GET | `/admin/finance/payouts` | `status`, `limit`, `offset` | `IPayout[]` |
| GET | `/admin/finance/payouts/:id` | — | `IPayout` |
| PUT | `/admin/finance/payouts/:id/retry` | — | `IPayout` |

---

## 10. Page Logic & Features

### Dashboard (`/admin/dashboard`)

- Fetches `IAnalytics.UnifiedResponse` and `IAnalytics.PaymentsResponse`.
- Date range presets: `7d`, `30d`, `90d`, current month, last month (stored in component state, not URL).
- KPI cards show absolute values + percentage change vs previous period.
- Heatmap is a 7×24 grid (rows = days Sun–Sat, cols = hours 0–23), color-scaled by bid count.
- Top lots table is paginated client-side.
- Budget targets (daily / monthly) are user-configurable and persisted to `localStorage` under key `gbid_budgets`.
- "Pending actions" widget links to pending auctions, lots, disputes counts from `actionsNeeded`.

### Auctions (`/admin/auctions`)

- Full CRUD on auctions.
- Status lifecycle: `draft → pending_review → active → ended/cancelled`.
- Admin actions: **approve** (moves to `active`), **reject** (requires reason), **cancel**, **schedule** (sets `startTime` + `lotIntervalMinutes`).
- Detail view lists all lots assigned to the auction; admin can add/remove lots.
- Lots can only be assigned if `reviewStatus === 'approved'`.

### Lots (`/admin/lots`)

- Read-only listing for admin; vendors create lots via the vendor-facing app.
- Review workflow: `submitted → approved` or `submitted → rejected` (reason required).
- Approved lots become assignable to auctions.
- Filters: by `vendorId`, `reviewStatus`, `status`.

### Categories (`/admin/categories`)

- Hierarchical categories (parent → children via `parentId`).
- CRUD with optional icon URL.
- Slug auto-derived from name (by backend).

### Users (`/admin/users`)

- Three account types: `bidder`, `vendor`, `admin`.
- Admin can suspend (block platform access) or reactivate users.
- Wallet credit: admin issues funds to a bidder's wallet; requires `amount` + `description`.
- Vendor sub-view: shows all payouts for a specific vendor.

### Finance (`/admin/finance`)

- Stats card shows platform-level totals.
- Payouts table filterable by `status` (`completed`, `failed`, `pending_review`).
- Failed payouts have a **retry** action that resets status.
- Each payout shows: gross, platform fee, net transfer amount, external `moolreReference`.

### Disputes (`/admin/disputes`)

- Admin reads message thread and resolves disputes.
- Resolution statuses and their meanings:
  - `resolved_refund` — full refund to buyer
  - `resolved_partial` — partial refund
  - `resolved_store_credit` — store credit issued
  - `resolved_no_action` — no action taken
  - `closed` — closed without formal resolution
- `outcomeNote` is optional free-text explanation attached to the resolution.

---

## 11. Custom Hooks

### `useFetchData(queryKey, fetcher, options?)`

Wraps React Query `useQuery`.
- Enabled only when user is authenticated.
- Retry: 2 attempts, exponential backoff (max 30 s).
- Returns: `{ data, isLoading, isError, error, refetch }`.

### `useFetchPaginated(queryKey, fetcher, page, pageSize)`

Like `useFetchData` but for paginated endpoints.
- Query key includes `page` + `pageSize`.
- Normalises both `T[]` and `{ data: T[], total: number }` response shapes.
- Returns: `{ data, total, isLoading, isError, error, refetch }`.

### `useAxios()`

Returns an async function that wraps `apiClient(config)`.
Used for mutations (POST / PUT / DELETE) — not React Query managed.

### `useBrowserStorage(key, defaultValue, type?)`

SSR-safe `localStorage` / `sessionStorage` accessor.
- `type`: `'local'` (default) or `'session'`.

### `useDataEncrypt()`

Wraps `crypto-js` for encrypting/decrypting data before storing in browser storage.

### `useMobile()`

Returns `true` when viewport width < breakpoint (mobile detection).

### `useCountdown(targetTime)`

Countdown timer to a target Unix timestamp. Used for session refresh indicators.

---

## 12. Routing & Middleware

**Middleware** (`middleware.ts`) runs on:
- `/` and `/(fr|en)/:path*`

Logic order:
1. Check auth via NextAuth `auth()`.
2. If the path is a public auth page (`/(en|fr)/?$`) and user is authenticated → redirect to `/[locale]/admin/dashboard`.
3. If the path requires auth and user is NOT authenticated → redirect to `/en` (login).
4. Apply next-intl middleware for locale detection/prefix.

**Auth pages** (public): `/(en|fr)/?$` — the sign-in root.
**Protected pages**: everything under `/(en|fr)/admin/*`.

---

## 13. Error Handling

| Layer | Mechanism |
|---|---|
| Forms | Zod schema + React Hook Form `errors` object → inline messages |
| API (4xx/5xx) | Axios interceptor rejects; React Query surfaces `isError` + `error` |
| 401 specifically | Axios interceptor auto-refreshes token before surfacing error |
| Token expired | `RefreshTokenHandler` component calls `signOut()` |
| User-facing errors | Sonner toast (`toast.error(message)`) |

---

## 14. Key Business Rules

1. **Auction approval gate** — Auctions must pass through `pending_review` before going `active`. Admin explicitly approves or rejects.
2. **Lot review gate** — Vendor-submitted lots (`submitted`) must be reviewed (`approved`/`rejected`) before they can join an auction.
3. **Lot assignment constraint** — Only `reviewStatus === 'approved'` lots can be added to an auction.
4. **Payout calculation** — `transferAmount = grossAmount - platformCharge`. Stored on each payout record.
5. **Dispute blocks payout** — Disputes should be resolved before the related payout is marked `completed` (enforced by backend; admin sees `pending_review` payouts alongside open disputes).
6. **Wallet credits** — Admins can manually credit a bidder's wallet (e.g., for compensation). Each credit requires an audit `description`.
7. **Token lifespan** — The session lives as long as the refresh token (`exp` = `refreshTokenExpiry`). Access tokens rotate silently every N minutes via the 5-minute buffer check.
8. **Multi-tenant header** — Every API request carries `X-Tenant-Domain: admin` to isolate admin requests from other tenant contexts on the same backend.
9. **Lot interval scheduling** — When scheduling an auction, `lotIntervalMinutes` determines the gap between sequential lot bidding windows; the backend computes individual `bidStartTime`/`bidEndTime` per lot.
10. **Featured auctions** — `isFeatured: true` surfaces the auction prominently in buyer-facing views (backend/front-end logic for display is outside this admin).
