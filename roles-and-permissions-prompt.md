# Backend Implementation Prompt — Roles & Permissions (Gems.Bid Admin)

You are implementing a roles and permissions system for the Gems.Bid auction
platform backend. This is a multi-tenant API (tenants identified by
`X-Tenant-Domain` header). The admin frontend at `/en/admin/*` is already
built; the backend needs to expose a RBAC (Role-Based Access Control) system
that the frontend can consume.

---

## Context

**Existing user account types** (already in DB): `bidder` | `vendor` | `admin`

**Admin panel sections and what they do:**

| Section | Description |
|---|---|
| Dashboard | `GET /admin/analytics`, `/admin/analytics/payments` |
| Auctions | CRUD on auctions, approve / reject / schedule |
| Vendor Lots | View and review (approve / reject) vendor-submitted lots |
| Categories | CRUD on categories |
| Users | List / view users, credit wallet balances |
| Finance | `GET /admin/finance/stats`, manage payouts, retry failed payouts |
| Disputes | View and resolve buyer-seller disputes |

**Auth flow:**
- Login → `POST /auth/admin-login` → returns `{ accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry }`
- Every API request carries: `Authorization: Bearer <accessToken>` and `X-Tenant-Domain: admin`
- Token refresh → `GET /auth/refresh` with `X-Refresh-Token` header

---

## Roles to Implement

Define these six admin roles (stored in a `roles` table):

| Role | Description |
|---|---|
| `super_admin` | Full access to everything including role assignment |
| `admin` | Full access except cannot manage super_admins or assign roles |
| `finance_manager` | View analytics + full access to finance / payouts only |
| `support_agent` | View auctions / users / analytics + full resolve access on disputes |
| `auction_manager` | Create / edit / approve auctions and lots + view analytics |
| `catalog_manager` | CRUD on categories only |

---

## Permission Model

Use a **resource × action** permission matrix.

| Resource | Actions |
|---|---|
| `analytics` | `view` |
| `auctions` | `view`, `create`, `edit`, `delete`, `approve` |
| `lots` | `view`, `edit`, `approve` |
| `categories` | `view`, `create`, `edit`, `delete` |
| `users` | `view`, `credit` |
| `finance` | `view`, `retry_payout` |
| `disputes` | `view`, `resolve` |
| `roles` | `view`, `assign` *(super_admin only)* |

A permission key is `resource.action` — e.g. `"auctions.approve"`.

**Role → permission mapping** (seed this data):

```
super_admin:
  ALL permissions

admin:
  ALL except roles.view, roles.assign

finance_manager:
  analytics.view
  finance.view
  finance.retry_payout

support_agent:
  analytics.view
  auctions.view
  lots.view
  users.view
  disputes.view
  disputes.resolve

auction_manager:
  analytics.view
  auctions.view, auctions.create, auctions.edit, auctions.approve
  lots.view, lots.edit, lots.approve

catalog_manager:
  categories.view, categories.create, categories.edit, categories.delete
```

---

## Database Schema

Add these tables via migration:

```sql
-- Roles
CREATE TABLE roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50)  UNIQUE NOT NULL,  -- e.g. 'super_admin'
  label       VARCHAR(100),                  -- e.g. 'Super Admin'
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT FALSE, -- system roles cannot be deleted
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Individual permissions
CREATE TABLE permissions (
  id       SERIAL PRIMARY KEY,
  resource VARCHAR(50) NOT NULL,  -- e.g. 'finance'
  action   VARCHAR(50) NOT NULL,  -- e.g. 'retry_payout'
  UNIQUE (resource, action)
);

-- Role ↔ permission join
CREATE TABLE role_permissions (
  role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User ↔ role join (admin users only)
CREATE TABLE user_roles (
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id     INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by INT REFERENCES users(id),
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

**Notes:**
- A user can hold multiple roles; effective permissions are the **union** across all assigned roles.
- On login, load the user's full permission set and embed it in the access token so guards never need a DB hit per request.

---

## Auth Token Changes

Update `POST /auth/admin-login` response to include:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "accessTokenExpiry": 900,
  "refreshTokenExpiry": 604800,
  "user": {
    "id": 1,
    "username": "misbahu",
    "email": "...",
    "phone": "...",
    "accountType": "admin",
    "avatar": null,
    "role": "super_admin",
    "permissions": [
      "analytics.view",
      "auctions.view",
      "auctions.create",
      "finance.view",
      "finance.retry_payout"
    ]
  }
}
```

`permissions` is derived at login time from the user's `user_roles` → `role_permissions` join. It is cached in the JWT so every request guard can check it without a DB query.

---

## API Endpoints

All under `/admin/roles` — protected, requiring `roles.view` or `roles.assign` as noted.

### Roles CRUD

```
GET    /admin/roles
  Required: roles.view
  Returns all roles with their permission list.
  Response: { data: Role[] }
  Role: { id, name, label, description, isSystem, permissions: string[] }

GET    /admin/roles/:id
  Required: roles.view
  Single role + users currently assigned to it.
  Response: { data: Role & { users: AdminUser[] } }

POST   /admin/roles
  Required: roles.assign
  Create a custom role.
  Body: { name: string, label: string, description?: string, permissions: string[] }

PUT    /admin/roles/:id
  Required: roles.assign
  Update label, description, or permission set.
  Body: { label?: string, description?: string, permissions?: string[] }
  Block updates to is_system roles' name field.

DELETE /admin/roles/:id
  Required: roles.assign
  Delete a role. Return 400 if role has is_system = true.
```

### Permissions list (for the role editor UI)

```
GET    /admin/roles/permissions
  Required: roles.view
  All available resource × action pairs.
  Response: { data: [{ id, resource, action, key: "resource.action" }] }
```

### User ↔ role assignment

```
GET    /admin/users/:userId/roles
  Required: roles.view
  Roles currently assigned to a user.

POST   /admin/users/:userId/roles
  Required: roles.assign
  Assign a role to an admin user.
  Body: { roleId: number }
  Return 409 if already assigned.

DELETE /admin/users/:userId/roles/:roleId
  Required: roles.assign
  Remove a role from a user.
  Block removing the last role from a super_admin.
```

---

## Permission Guard Middleware

Implement a middleware that runs on every `/admin/*` route **after** auth token verification:

1. Decode the Bearer JWT → read `permissions: string[]` from the payload.
2. Look up the route + HTTP method in the permission map below.
3. If the required permission is **not** in the token's list → return `403`.
4. If the token is expired → `401` (existing auth middleware already handles this).

**403 response body:**
```json
{ "status": false, "error": "Forbidden", "required": "resource.action" }
```

### Route → permission map

```
GET    /admin/analytics*                  →  analytics.view

GET    /admin/auctions                    →  auctions.view
POST   /admin/auctions                    →  auctions.create
PUT    /admin/auctions/:id                →  auctions.edit
DELETE /admin/auctions/:id                →  auctions.delete
PUT    /admin/auctions/:id/approve        →  auctions.approve
PUT    /admin/auctions/:id/reject         →  auctions.approve
PUT    /admin/auctions/:id/schedule       →  auctions.edit

GET    /admin/lots*                       →  lots.view
PUT    /admin/lots/:id                    →  lots.edit
PUT    /admin/lots/:id/approve            →  lots.approve
PUT    /admin/lots/:id/reject             →  lots.approve

GET    /admin/categories                  →  categories.view
POST   /admin/categories                  →  categories.create
PUT    /admin/categories/:id              →  categories.edit
DELETE /admin/categories/:id              →  categories.delete

GET    /admin/users*                      →  users.view
POST   /admin/users/:id/wallet/credit     →  users.credit

GET    /admin/finance*                    →  finance.view
GET    /admin/vendors/:id/payouts         →  finance.view
PUT    /admin/finance/payouts/:id/retry   →  finance.retry_payout

GET    /admin/disputes*                   →  disputes.view
PUT    /admin/disputes/:id/resolve        →  disputes.resolve

GET    /admin/roles*                      →  roles.view
POST   /admin/roles                       →  roles.assign
PUT    /admin/roles/:id                   →  roles.assign
DELETE /admin/roles/:id                   →  roles.assign
POST   /admin/users/:id/roles             →  roles.assign
DELETE /admin/users/:id/roles/:roleId     →  roles.assign
```

---

## Seeding

Run this as part of a seed file or migration:

1. Insert all permissions from the resource × action table above.
2. Insert the 6 system roles with `is_system = true`.
3. Assign permissions to each role per the matrix above.
4. Assign `super_admin` role to the first admin user (`id = 1`) if they exist.

---

## Response Format Conventions

Match the existing API envelope:

```json
// Success (single or list)
{ "status": true, "data": <payload> }

// Paginated
{ "status": true, "data": { "count": 42, "page": 1, "limit": 20, "data": [] } }

// Error
{ "status": false, "error": "Human readable message" }

// Forbidden (403)
{ "status": false, "error": "Forbidden", "required": "resource.action" }
```

---

## What the Frontend Will Do After This

1. Read `user.role` and `user.permissions[]` from the login response.
2. Store them in the NextAuth JWT session alongside the access token.
3. Use `permissions[]` to conditionally render sidebar items, buttons, and action menus — e.g. hide the **Retry** button if `finance.retry_payout` is absent.
4. The backend guards are the **enforcement layer** — the frontend is UI gating only.

---

## Implementation Order

1. DB migration (roles, permissions, role_permissions, user_roles tables)
2. Seed file (permissions → roles → role_permission assignments → first user)
3. Permission guard middleware (JWT decode → check map → 403 if missing)
4. Update login endpoint to include `role` + `permissions[]` in user payload
5. CRUD endpoints for roles, permissions list, user-role assignment
