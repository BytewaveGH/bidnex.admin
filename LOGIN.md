# Login Flow — Gems.Bid Admin

This document describes how authentication works end-to-end in the admin panel.

---

## Overview

Authentication is handled by **NextAuth v5** using a **Credentials provider**. The backend issues short-lived access tokens and long-lived refresh tokens. The admin panel manages these transparently, refreshing the access token automatically before it expires.

---

## Flow Diagram

```
User fills form → signIn('credentials') → NextAuth authorize()
    → POST /auth/admin-login (backend)
        → returns { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry, user }
    → JWT callback stores tokens in encrypted cookie
    → session callback exposes tokens to client
    → router.push(/{locale}/admin/dashboard)
```

---

## 1. Login Page

**Route:** `/{locale}` (e.g. `/en`)

**Files:**
- [`src/app/[locale]/(auth)/page.tsx`](src/app/[locale]/(auth)/page.tsx) — page entry point
- [`src/components/generals/authentication/sign-in.tsx`](src/components/generals/authentication/sign-in.tsx) — layout (image + form)
- [`src/components/generals/authentication/widgets/forms/sign-in.tsx`](src/components/generals/authentication/widgets/forms/sign-in.tsx) — form logic

The form uses `react-hook-form` with a Zod schema that requires a non-empty `email` and `password`. On submit it calls `signIn('credentials', { email, password, redirect: false })` from `next-auth/react`.

---

## 2. Credential Validation

**File:** [`src/auth.config.ts`](src/auth.config.ts)

### `authorize(credentials, req)`

1. Validates credentials against `SignInFormSchema` (Zod — both fields required).
2. Resolves the **tenant** from the `host` header. Defaults to `'admin'`; can be overridden via `TENANT_DOMAIN` env var.
3. Calls `loginRequest()` which sends:

```
POST {NEXT_PUBLIC_API_URL}/auth/admin-login
Headers:
  Content-Type: application/json
  X-Tenant-Domain: {tenant}
Body:
  { email, password }
```

4. On success the backend returns `IAuth.Response`:

```ts
{
  accessToken: string
  refreshToken: string
  accessTokenExpiry: number   // seconds (relative or absolute unix timestamp)
  refreshTokenExpiry: number
  user: { id, username, accountType, avatar, phone, email, ... }
}
```

5. Returns the user object to NextAuth. On failure (non-2xx or validation error) returns `null`, which triggers an auth error back to the form.

---

## 3. JWT & Session Callbacks

**File:** [`src/auth.config.ts`](src/auth.config.ts)

### `jwt` callback

Runs server-side every time a JWT is read.

- On **first sign-in** (`user` is present): maps all user fields and tokens into the JWT. Expiry values are normalised to absolute unix timestamps via `toAbsoluteExpiry()`.
- On **subsequent requests**: checks if the access token is within **5 minutes of expiry**. If so, calls `refreshAccessToken()` (see §4).
- Sets `token.exp` to the refresh token expiry so the NextAuth cookie itself lives as long as the refresh token.

### `session` callback

Maps all JWT fields into `session.user`, including `error` so client code can detect a failed refresh.

### Session strategy

Uses **`'jwt'`** — no database required. The session is stored entirely in a signed, encrypted cookie.

---

## 4. Token Refresh

There are two refresh mechanisms working together:

### A. Server-side (JWT callback)

Automatic. Every time the JWT is read (on any request to `/api/auth/session`), the `jwt` callback checks if the access token expires within 5 minutes. If yes, it calls:

```
POST {NEXT_PUBLIC_API_URL}/auth/refresh
Headers:
  Content-Type: application/json
  X-Refresh-Token: {refreshToken}
  X-Tenant-Domain: admin
```

On success it updates all token fields. On failure it sets `error: 'RefreshAccessTokenError'`.

### B. Client-side (Axios interceptor)

**File:** [`src/lib/axios-client.ts`](src/lib/axios-client.ts)

When any API call returns **401**, the interceptor:
1. Calls `getSession()` to trigger the JWT callback (which refreshes the token server-side).
2. If the new session has a valid access token, retries the original request.
3. If refresh failed (`error === 'RefreshAccessTokenError'`), calls `signOut({ callbackUrl: '/en' })` and rejects all queued requests.

Queued requests during an in-flight refresh are held in `refreshQueue` and replayed once the new token is available — preventing multiple concurrent refresh calls.

### C. Proactive client timer

**File:** [`src/app/[locale]/(auth)/_logics/refresh-token-handler.tsx`](src/app/[locale]/(auth)/_logics/refresh-token-handler.tsx)

`RefreshTokenHandler` is a render-less component that watches the session and computes the next refresh interval (access token expiry minus 1 minute). It drives NextAuth's `refetchInterval` so the session is proactively re-fetched before the token expires. If it detects `RefreshAccessTokenError` it immediately signs the user out.

---

## 5. Route Protection (Middleware)

**File:** [`src/middleware.ts`](src/middleware.ts)

```ts
matcher: ['/', '/(fr|en)/:path*']
```

Every matched request runs through `auth()`. Logic:

- `isLoggedIn` — truthy when `req.auth` (the session) is present.
- `isAuthPage` — matches `/(en|fr)` root exactly (the login page).
- If **not logged in and not on the auth page** → redirect to `/en`.
- Otherwise pass through to the i18n middleware (`next-intl`).

This means every page under `/{locale}/admin/*` is protected. The login page itself (`/{locale}`) is always public.

---

## 6. Axios Client — Attaching Tokens

**File:** [`src/lib/axios-client.ts`](src/lib/axios-client.ts)

All API calls use `apiClient` (an Axios instance). The request interceptor:

1. Reads the session via `getSessionSync()` (in-memory store) or awaits `waitForSession()` if not yet initialised.
2. Attaches `Authorization: Bearer {accessToken}` and `X-Tenant-Domain: {tenant}` to every outgoing request.

The in-memory session store ([`src/lib/session-store.ts`](src/lib/session-store.ts)) is populated by the layout/provider on mount so the access token is available synchronously for subsequent requests.

---

## 7. Sign-out

Triggered by:
- Calling `signOut({ callbackUrl: '/en' })` (manual or on refresh failure).
- NextAuth redirects to `/en` (the login page) as configured in `pages.signOut`.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for all backend API calls |
| `TENANT_DOMAIN` | Override the tenant resolved from the host header |
| `BETTER_AUTH_SECRET` | Secret used to sign/encrypt NextAuth JWTs and cookies |

---

## Key Files Reference

| File | Role |
|---|---|
| [`src/auth.config.ts`](src/auth.config.ts) | Credentials provider, JWT/session callbacks, refresh logic |
| [`src/auth.ts`](src/auth.ts) | NextAuth initialisation — exports `handlers`, `auth`, `signIn`, `signOut` |
| [`src/middleware.ts`](src/middleware.ts) | Route guard — redirects unauthenticated users to `/en` |
| [`src/app/api/auth/[...nextauth]/route.ts`](src/app/api/auth/[...nextauth]/route.ts) | NextAuth API route handler |
| [`src/components/generals/authentication/widgets/forms/sign-in.tsx`](src/components/generals/authentication/widgets/forms/sign-in.tsx) | Login form UI and submit logic |
| [`src/lib/axios-client.ts`](src/lib/axios-client.ts) | Axios instance with auth interceptors |
| [`src/lib/session-store.ts`](src/lib/session-store.ts) | In-memory session cache for synchronous token access |
| [`src/app/[locale]/(auth)/_logics/refresh-token-handler.tsx`](src/app/[locale]/(auth)/_logics/refresh-token-handler.tsx) | Proactive client-side token refresh timer |
| [`src/types/next-auth.d.ts`](src/types/next-auth.d.ts) | Extended NextAuth type declarations |
| [`src/types/interfaces/index.ts`](src/types/interfaces/index.ts) | `IAuth.Response` — backend auth response shape |
