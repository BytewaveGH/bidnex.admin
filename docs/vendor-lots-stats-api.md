# Vendor Lots Statistics — API Spec

This endpoint powers the four stat cards at the top of the admin **Vendor Lots** page.
It returns a single aggregated snapshot so the frontend makes one request instead of one per status.

---

## Endpoint

```
GET /admin/lots/stats
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
    // ── Core count ─────────────────────────────────────────────────────────
    "total": 21,                // all lots, all review statuses

    // ── By review status ───────────────────────────────────────────────────
    "byReviewStatus": {
      "draft":      2,
      "submitted":  6,          // pending review
      "approved":  11,
      "rejected":   2
    },

    // ── By lot status ──────────────────────────────────────────────────────
    "byStatus": {
      "active":  8,
      "unsold":  7,
      "sold":    4,
      "pending": 2
    },

    // ── Submission activity ────────────────────────────────────────────────
    "newSubmissions": {
      "today":     3,           // UTC day
      "thisWeek": 11,           // Mon–Sun UTC week
      "thisMonth": 21           // calendar month to date
    }
  }
}
```

### Field notes

| Field | Type | Notes |
|---|---|---|
| `total` | `integer` | All lots regardless of status |
| `byReviewStatus.draft` | `integer` | Lots with `reviewStatus = 'draft'` |
| `byReviewStatus.submitted` | `integer` | Lots with `reviewStatus = 'submitted'` — this is "Pending Review" |
| `byReviewStatus.approved` | `integer` | Lots with `reviewStatus = 'approved'` |
| `byReviewStatus.rejected` | `integer` | Lots with `reviewStatus = 'rejected'` |
| `byStatus.active` | `integer` | Lots with `status = 'active'` |
| `byStatus.unsold` | `integer` | Lots with `status = 'unsold'` |
| `byStatus.sold` | `integer` | Lots with `status = 'sold'` |
| `byStatus.pending` | `integer` | Lots with `status = 'pending'` |
| `newSubmissions.today` | `integer` | Submitted today (UTC midnight boundary) |
| `newSubmissions.thisWeek` | `integer` | Submitted in the current ISO week |
| `newSubmissions.thisMonth` | `integer` | Submitted in the current calendar month |

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

Called once on page load. Frontend caches for **60 seconds**.
A Redis TTL of 30–60 s server-side is fine — does not need to be real-time.

---

## What the frontend renders

The four stat cards currently displayed:

| Card | Field used |
|---|---|
| Total Lots | `data.total` |
| Pending Review | `data.byReviewStatus.submitted` |
| Approved | `data.byReviewStatus.approved` |
| Rejected | `data.byReviewStatus.rejected` |

The remaining fields (`byReviewStatus.draft`, `byStatus.*`, `newSubmissions.*`)
are available in the response and can be surfaced in future cards without a new API call.
