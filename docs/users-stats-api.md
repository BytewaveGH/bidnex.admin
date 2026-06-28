# Users Statistics — API Spec

This endpoint powers the four stat cards at the top of the admin **Users** page.
It should return a single aggregated snapshot so the frontend makes one request instead of four.

---

## Endpoint

```
GET /admin/users/stats
```

### Auth headers (required on all admin endpoints)

```
Authorization:   Bearer {accessToken}
X-Tenant-Domain: admin
```

---

## Response

### Shape

```jsonc
{
  "data": {
    // ── Core counts ────────────────────────────────────────────────────────
    "total": 4218,               // all users, all account types

    "byAccountType": {
      "bidder": 3804,
      "vendor":  320,
      "admin":    94
    },

    "byStatus": {
      "active":    3891,
      "suspended":  327
    },

    // ── Registration activity ──────────────────────────────────────────────
    "newRegistrations": {
      "today":     14,   // UTC day
      "thisWeek":  87,   // Mon–Sun UTC week
      "thisMonth": 214   // calendar month to date
    },

    // ── Verification ───────────────────────────────────────────────────────
    "verifiedCount":    2904,
    "verificationRate": 68.8   // percentage, 1 decimal place
  }
}
```

### Field notes

| Field | Type | Notes |
|---|---|---|
| `total` | `integer` | Sum of all account types |
| `byAccountType.bidder` | `integer` | Users with `accountType = 'bidder'` |
| `byAccountType.vendor` | `integer` | Users with `accountType = 'vendor'` |
| `byAccountType.admin` | `integer` | Users with `accountType = 'admin'` |
| `byStatus.active` | `integer` | Users with `status = 'active'` |
| `byStatus.suspended` | `integer` | Users with `status = 'suspended'` |
| `newRegistrations.today` | `integer` | Registered today (UTC midnight boundary) |
| `newRegistrations.thisWeek` | `integer` | Registered in the current ISO week |
| `newRegistrations.thisMonth` | `integer` | Registered in the current calendar month |
| `verifiedCount` | `integer` | Users where `isVerified = true` |
| `verificationRate` | `float` | `(verifiedCount / total) * 100`, 1 decimal |

---

## Error responses

| Status | When |
|---|---|
| `401 Unauthorized` | Missing or expired Bearer token |
| `403 Forbidden` | Token is valid but account is not `admin` type |
| `500 Internal Server Error` | Aggregation query failed |

Error body:
```json
{
  "error": "Unauthorized"
}
```

---

## Caching guidance

This endpoint is called once on page load and cached for **60 seconds** on the frontend.
Feel free to cache the aggregation result server-side (Redis TTL of 30–60 s is fine).
It does **not** need to be real-time — a few seconds of lag is acceptable.

---

## What the frontend renders

The four stat cards currently displayed:

| Card | Field used |
|---|---|
| Total Users | `data.total` |
| Bidders | `data.byAccountType.bidder` |
| Vendors | `data.byAccountType.vendor` |
| Admins | `data.byAccountType.admin` |

The remaining fields (`byStatus`, `newRegistrations`, `verifiedCount`, `verificationRate`)
are available in the response type and can be surfaced in future cards or an analytics section without a new API call.
