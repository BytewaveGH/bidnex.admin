# `GET /api/admin/analytics` — Default Dashboard Endpoint Specification

This endpoint powers the main admin overview dashboard (`/dashboard`).
All sections on the page load from this single call — no query params, no pagination.

---

## Response envelope

```json
{
  "status": true,
  "data": { ... }
}
```

---

## `data.kpis` — required

Four KPI tiles at the top of the page.

```json
"kpis": {
  "activeAuctions": 3,
  "bidsToday":      312,
  "totalUsers":     1840,
  "revenueChange":  12.4,
  "openDisputes":   5,
  "totalRevenue":   4821300
}
```

| Field | Type | Description |
|---|---|---|
| `activeAuctions` | `number` | Auctions currently in `live` / `active` status right now |
| `bidsToday` | `number` | Total bid events placed since midnight UTC today |
| `totalUsers` | `number` | Total registered user accounts (all roles) |
| `revenueChange` | `number` | Percentage change in revenue vs the previous calendar month — positive = growth, negative = decline. Drives the trend badge on the Total Users tile |
| `openDisputes` | `number` | Disputes with status `open` or `awaiting_response` |
| `totalRevenue` | `number` | Cumulative platform revenue (GHS) from all settled lots, all time |

---

## `data.topLots` — required

The highest-performing lots by `currentBid`, for the Ranked Lots table.

```json
"topLots": [
  {
    "id": 101,
    "title": "Rolex Submariner Date (1985)",
    "auctionTitle": "Luxury Goods – July Auction",
    "currentBid": 6800,
    "bidCount": 24,
    "image": "https://cdn.example.com/lots/rolex.jpg"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Lot ID |
| `title` | `string` | Lot title — shown as the primary row label |
| `auctionTitle` | `string \| null` | Name of the auction this lot belongs to — shown as a subtitle under the title |
| `currentBid` | `number` | Highest bid reached (GHS) — shown as "Final Price" |
| `bidCount` | `number` | Total number of bids placed on this lot |
| `image` | `string \| null` | Primary image URL — rendered as a 32 px thumbnail |

> Return up to **5** lots, sorted descending by `currentBid`.

---

## `data.auctionPerformance` — required

The Live Auctions feed list. Each row shows the auction name, lot/bid counts, revenue, and a "reserve met %" badge computed as `round(soldCount / lotsCount * 100)`.

```json
"auctionPerformance": [
  {
    "id": 9,
    "title": "Luxury Goods – July Auction",
    "revenue": 187500,
    "lotsCount": 18,
    "soldCount": 14,
    "bidCount": 312
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Auction ID |
| `title` | `string` | Auction title |
| `revenue` | `number` | Total GHS revenue from settled lots in this auction |
| `lotsCount` | `number` | Total lots assigned to this auction |
| `soldCount` | `number` | Lots that reached a winning bid (settled / sold). Used to compute reserve-met % |
| `bidCount` | `number` | Total bid events across all lots in this auction |

> Return up to **10** most recent / active auctions, sorted descending by `revenue`.

---

## `data.actionsNeeded` — required

Counts of items that require admin attention. Two items (`pendingLots` and `openDisputes`) are rendered as live action rows with urgency badges. The third is stored for future use.

```json
"actionsNeeded": {
  "pendingLots":     14,
  "openDisputes":    5,
  "pendingAuctions": 2
}
```

| Field | Type | Description |
|---|---|---|
| `pendingLots` | `number` | Lots with `reviewStatus = "submitted"` waiting for admin approval — shown with amber / warning badge |
| `openDisputes` | `number` | Open disputes requiring a response — shown with destructive / red badge |
| `pendingAuctions` | `number` | Auctions in `draft` or `pending_approval` status — stored but not yet rendered |

---

## `data.revenueBids` — required

Time-series data for the Revenue & Bids combo chart. Must return all four period arrays at once — the frontend switches between them client-side with no additional API calls.

```json
"revenueBids": {
  "daily": [
    { "label": "Mon", "revenue": 8400,   "bids": 34 },
    { "label": "Tue", "revenue": 12200,  "bids": 51 },
    { "label": "Wed", "revenue": 9800,   "bids": 42 },
    { "label": "Thu", "revenue": 15600,  "bids": 67 },
    { "label": "Fri", "revenue": 11300,  "bids": 48 },
    { "label": "Sat", "revenue": 22100,  "bids": 93 },
    { "label": "Sun", "revenue": 18500,  "bids": 79 }
  ],
  "weekly": [
    { "label": "Wk 1", "revenue": 68000,  "bids": 284 },
    { "label": "Wk 2", "revenue": 91000,  "bids": 379 },
    { "label": "Wk 3", "revenue": 74000,  "bids": 311 },
    { "label": "Wk 4", "revenue": 110000, "bids": 462 },
    { "label": "Wk 5", "revenue": 88000,  "bids": 368 },
    { "label": "Wk 6", "revenue": 95000,  "bids": 397 },
    { "label": "Wk 7", "revenue": 82000,  "bids": 344 },
    { "label": "Wk 8", "revenue": 124000, "bids": 519 }
  ],
  "monthly": [
    { "label": "Jan", "revenue": 310000, "bids": 1290 },
    { "label": "Feb", "revenue": 275000, "bids": 1150 },
    { "label": "Mar", "revenue": 398000, "bids": 1660 },
    { "label": "Apr", "revenue": 342000, "bids": 1430 },
    { "label": "May", "revenue": 460000, "bids": 1920 },
    { "label": "Jun", "revenue": 415000, "bids": 1730 },
    { "label": "Jul", "revenue": 388000, "bids": 1620 },
    { "label": "Aug", "revenue": 502000, "bids": 2100 },
    { "label": "Sep", "revenue": 447000, "bids": 1870 },
    { "label": "Oct", "revenue": 521000, "bids": 2180 },
    { "label": "Nov", "revenue": 610000, "bids": 2550 },
    { "label": "Dec", "revenue": 694000, "bids": 2900 }
  ],
  "yearly": [
    { "label": "2022", "revenue": 2100000, "bids": 8800 },
    { "label": "2023", "revenue": 3400000, "bids": 14200 },
    { "label": "2024", "revenue": 4800000, "bids": 20100 },
    { "label": "2025", "revenue": 5900000, "bids": 24600 },
    { "label": "2026", "revenue": 7200000, "bids": 30100 }
  ]
}
```

| Period | Length | `label` format | Window |
|---|---|---|---|
| `daily` | 7 | Day abbreviation: `"Mon"` … `"Sun"` | Last 7 days, oldest first |
| `weekly` | 8 | `"Wk N"` | Last 8 calendar weeks, oldest first |
| `monthly` | 12 | Month abbreviation: `"Jan"` … `"Dec"` | Last 12 calendar months, oldest first |
| `yearly` | 5 | Full year string: `"2022"` | Last 5 years, oldest first |

Each point:

| Field | Type | Description |
|---|---|---|
| `label` | `string` | X-axis display label |
| `revenue` | `number` | Total GHS settled in that bucket |
| `bids` | `number` | Total bid events placed in that bucket |

---

## `data.lotPipeline` — required

Horizontal bar funnel showing the current calendar month's lot approval pipeline, plus an all-time settled count shown in the footer.

```json
"lotPipeline": {
  "submitted":      127,
  "approved":       89,
  "live":           63,
  "settled":        51,
  "settledAllTime": 1284
}
```

| Field | Type | Description |
|---|---|---|
| `submitted` | `number` | Lots submitted by vendors this calendar month |
| `approved` | `number` | Of those, how many were approved by admins |
| `live` | `number` | Of those approved, how many went live in an auction |
| `settled` | `number` | Of those live, how many are now settled with a winner |
| `settledAllTime` | `number` | Total settled lots across all time — shown in the funnel footer and also consumed by the KPI tiles |

> Invariant: `submitted >= approved >= live >= settled`

---

## `data.topVendors` — required

Vendor leaderboard ranked by revenue for the current calendar month.

```json
"topVendors": [
  {
    "id": 3,
    "name": "Accra Luxury Traders",
    "lotsSettled": 42,
    "revenue": 187500,
    "trend": "up"
  },
  {
    "id": 7,
    "name": "TechHub Ghana Ltd.",
    "lotsSettled": 67,
    "revenue": 142300,
    "trend": "down"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Vendor user ID |
| `name` | `string` | Vendor display name |
| `lotsSettled` | `number` | Lots settled by this vendor this calendar month — shown as "X lots settled" |
| `revenue` | `number` | Total GHS revenue from their settled lots this month |
| `trend` | `"up" \| "down"` | `"up"` if this month's revenue > last month's, `"down"` otherwise |

> Return up to **5** vendors, sorted descending by `revenue`.

---

## Complete response shape

```json
{
  "status": true,
  "data": {
    "kpis": {
      "activeAuctions": number,
      "bidsToday":      number,
      "totalUsers":     number,
      "revenueChange":  number,
      "openDisputes":   number,
      "totalRevenue":   number
    },
    "topLots": [
      {
        "id":           number,
        "title":        string,
        "auctionTitle": string | null,
        "currentBid":   number,
        "bidCount":     number,
        "image":        string | null
      }
    ],
    "auctionPerformance": [
      {
        "id":        number,
        "title":     string,
        "revenue":   number,
        "lotsCount": number,
        "soldCount": number,
        "bidCount":  number
      }
    ],
    "actionsNeeded": {
      "pendingLots":     number,
      "openDisputes":    number,
      "pendingAuctions": number
    },
    "revenueBids": {
      "daily":   [ { "label": string, "revenue": number, "bids": number } ],
      "weekly":  [ { "label": string, "revenue": number, "bids": number } ],
      "monthly": [ { "label": string, "revenue": number, "bids": number } ],
      "yearly":  [ { "label": string, "revenue": number, "bids": number } ]
    },
    "lotPipeline": {
      "submitted":      number,
      "approved":       number,
      "live":           number,
      "settled":        number,
      "settledAllTime": number
    },
    "topVendors": [
      {
        "id":          number,
        "name":        string,
        "lotsSettled": number,
        "revenue":     number,
        "trend":       "up" | "down"
      }
    ]
  }
}
```

---

## Notes

- **Auth**: requires a valid admin Bearer token. Return `401` for missing/invalid, `403` for non-admin.
- **No query params**: this endpoint is called unconditionally on page load. All period breakdowns (`revenueBids`) must be pre-computed and returned together.
- **Currency**: all monetary values in **GHS** as plain numbers — no symbol, no formatting.
- **Timezone**: use **UTC** for all date bucketing.
- **Empty arrays**: return `[]` — never `null` — for any array field with no data. Return `0` for numeric counts with no data.
- **Caching**: this endpoint is polled every 5 minutes by the dashboard. Aggregate queries (revenue totals, bid counts, lot pipeline) should be cached server-side with a 60-second TTL — do not run raw heavy aggregates on every request.
- **`revenueBids` bucketing**: each period array is computed independently. `daily` uses the last 7 calendar days (UTC midnight boundaries). `weekly` uses ISO weeks. `monthly` uses calendar months. `yearly` uses full calendar years. All ordered oldest-first.
