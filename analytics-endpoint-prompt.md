# Analytics Endpoint — Remaining Data Prompt

This is a continuation prompt for the `/api/admin/analytics` endpoint.
The admin dashboard currently consumes **part** of the response. Below is exactly
what needs to be added to complete the remaining 3 components.

---

## Context — what already works

The endpoint currently returns:

```json
{
  "status": true,
  "data": {
    "kpis": {
      "totalRevenue": number,
      "revenueChange": number,
      "activeAuctions": number,
      "bidsToday": number,
      "openDisputes": number,
      "totalUsers": number
    },
    "topLots": [
      {
        "id": number,
        "title": string,
        "startingBid": number,
        "currentBid": number,
        "bidCount": number,
        "margin": number,
        "status": string,
        "auctionId": number,
        "auctionTitle": string
      }
    ],
    "auctionPerformance": [
      {
        "id": number,
        "title": string,
        "revenue": number,
        "lotsCount": number,
        "soldCount": number,
        "bidCount": number
      }
    ],
    "actionsNeeded": {
      "pendingAuctions": number,
      "pendingLots": number,
      "openDisputes": number
    }
  }
}
```

These fields are consumed and wired into the dashboard. Do not change their shape.

---

## What is missing — add these 3 keys to `data`

### 1. `revenueBids` — powers the Revenue & Bids chart

The chart has 4 period views: daily, weekly, monthly, yearly.
Each period is an array of `{ label, revenue, bids }` where:
- `label` is the display name for the X axis (e.g. "Mon", "Wk 1", "Jan", "2024")
- `revenue` is total GHS revenue for that period bucket (integer or float)
- `bids` is total number of bids placed in that bucket (integer)

```json
"revenueBids": {
  "daily": [
    { "label": "Mon", "revenue": 8400, "bids": 34 },
    { "label": "Tue", "revenue": 12200, "bids": 51 },
    { "label": "Wed", "revenue": 9800, "bids": 42 },
    { "label": "Thu", "revenue": 15600, "bids": 67 },
    { "label": "Fri", "revenue": 11300, "bids": 48 },
    { "label": "Sat", "revenue": 22100, "bids": 93 },
    { "label": "Sun", "revenue": 18500, "bids": 79 }
  ],
  "weekly": [
    { "label": "Wk 1", "revenue": 68000, "bids": 284 },
    { "label": "Wk 2", "revenue": 91000, "bids": 379 },
    { "label": "Wk 3", "revenue": 74000, "bids": 311 },
    { "label": "Wk 4", "revenue": 110000, "bids": 462 },
    { "label": "Wk 5", "revenue": 88000, "bids": 368 },
    { "label": "Wk 6", "revenue": 95000, "bids": 397 },
    { "label": "Wk 7", "revenue": 82000, "bids": 344 },
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
    { "label": "2021", "revenue": 2100000, "bids": 8800 },
    { "label": "2022", "revenue": 3400000, "bids": 14200 },
    { "label": "2023", "revenue": 4800000, "bids": 20100 },
    { "label": "2024", "revenue": 5900000, "bids": 24600 },
    { "label": "2025", "revenue": 7200000, "bids": 30100 }
  ]
}
```

> **Note on counts**: daily = last 7 days (most recent last), weekly = last 8 weeks,
> monthly = last 12 calendar months, yearly = last 5 years.
> The array values above are illustrative — return real database aggregates.

---

### 2. `lotPipeline` — powers the Lot Pipeline funnel

This shows how many lots are at each stage **this month** (calendar month),
plus an all-time settled count for the footer.

```json
"lotPipeline": {
  "submitted": 127,
  "approved": 89,
  "live": 63,
  "settled": 51,
  "settledAllTime": 1284
}
```

| Field | Description |
|---|---|
| `submitted` | Lots submitted by vendors this month (any status, as long as they entered the pipeline) |
| `approved` | Of those submitted, how many were approved |
| `live` | Of those approved, how many went live (auction started) |
| `settled` | Of those live, how many are settled/closed with a winner |
| `settledAllTime` | Total settled lots across all time, all periods — shown in the footer label |

> All four pipeline stages must be <= the previous stage (submitted >= approved >= live >= settled).

---

### 3. `topVendors` — powers the Top Vendors leaderboard

Ranked by total revenue this month, top 4 vendors.

```json
"topVendors": [
  {
    "id": 1,
    "name": "Accra Luxury Traders",
    "lotsSettled": 42,
    "revenue": 187500,
    "trend": "up"
  },
  {
    "id": 2,
    "name": "TechHub Ghana Ltd.",
    "lotsSettled": 67,
    "revenue": 142300,
    "trend": "up"
  },
  {
    "id": 3,
    "name": "Abena Gold & Jewels",
    "lotsSettled": 29,
    "revenue": 98700,
    "trend": "down"
  },
  {
    "id": 4,
    "name": "Dansoman Electronics",
    "lotsSettled": 51,
    "revenue": 76200,
    "trend": "up"
  }
]
```

| Field | Description |
|---|---|
| `id` | Vendor/user ID |
| `name` | Vendor display name |
| `lotsSettled` | Number of lots settled this month |
| `revenue` | Total GHS revenue from their settled lots this month |
| `trend` | `"up"` if their revenue this month > last month, `"down"` otherwise |

> Return exactly 4 vendors, sorted descending by `revenue`.

---

## Summary — updated full response shape

```json
{
  "status": true,
  "data": {
    "kpis": { ... },              // already exists — no changes
    "topLots": [ ... ],           // already exists — no changes
    "auctionPerformance": [ ... ],// already exists — no changes
    "actionsNeeded": { ... },     // already exists — no changes
    "revenueBids": {              // NEW
      "daily":   [ { "label": string, "revenue": number, "bids": number } ],
      "weekly":  [ { "label": string, "revenue": number, "bids": number } ],
      "monthly": [ { "label": string, "revenue": number, "bids": number } ],
      "yearly":  [ { "label": string, "revenue": number, "bids": number } ]
    },
    "lotPipeline": {              // NEW
      "submitted": number,
      "approved": number,
      "live": number,
      "settled": number,
      "settledAllTime": number
    },
    "topVendors": [               // NEW
      {
        "id": number,
        "name": string,
        "lotsSettled": number,
        "revenue": number,
        "trend": "up" | "down"
      }
    ]
  }
}
```

---

## Unused fields already in the response (FYI)

These are already returned but the frontend doesn't render them yet — no action needed on the backend:

- `kpis.totalRevenue` — total platform revenue
- `kpis.revenueChange` — percentage change vs last period
- `kpis.totalUsers` — total registered users
- `actionsNeeded.pendingAuctions` — auctions pending review
