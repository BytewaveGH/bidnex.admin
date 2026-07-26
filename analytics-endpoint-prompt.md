# `GET /api/admin/analytics` — Full Endpoint Specification

Build or update the admin analytics endpoint so it returns the complete response shape below.
All fields marked **required** must always be present. Fields marked **optional** may be omitted
if no data exists, but the frontend will fall back to mock data when they are absent so returning
real zeros is always preferable to omitting the key.

---

## Response envelope

```json
{
  "status": true,
  "data": { ... }
}
```

All payload lives inside `data`. The `status` boolean indicates success.

---

## `data.kpis` — required

Summary KPI cards shown at the top of the dashboard.

```json
"kpis": {
  "totalRevenue": 4821300,
  "revenueChange": 12.4,
  "activeAuctions": 3,
  "bidsToday": 312,
  "openDisputes": 5,
  "totalUsers": 1840
}
```

| Field | Type | Description |
|---|---|---|
| `totalRevenue` | `number` | Cumulative platform revenue (GHS) from all settled lots, all time |
| `revenueChange` | `number` | Percentage change in revenue vs. the previous calendar month (positive = growth, negative = decline) |
| `activeAuctions` | `number` | Auctions currently in `live` / `active` status right now |
| `bidsToday` | `number` | Total bid events placed since midnight today (UTC) |
| `openDisputes` | `number` | Disputes with status `open` or `awaiting_response` |
| `totalUsers` | `number` | Total registered user accounts (all roles) |

---

## `data.topLots` — required

The 5 highest-performing lots by `currentBid`, across all auctions, all time.

```json
"topLots": [
  {
    "id": 101,
    "title": "Rolex Submariner Date (1985)",
    "startingBid": 4000,
    "currentBid": 6800,
    "bidCount": 24,
    "margin": 70.0,
    "status": "sold",
    "image": "https://cdn.example.com/lots/rolex.jpg",
    "auctionId": 9,
    "auctionTitle": "Luxury Goods – July Auction"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Lot ID |
| `title` | `string` | Lot title |
| `startingBid` | `number` | Starting bid (GHS) |
| `currentBid` | `number` | Highest bid reached (GHS) |
| `bidCount` | `number` | Total number of bids placed on this lot |
| `margin` | `number` | `((currentBid - startingBid) / startingBid) * 100` — percentage above starting bid |
| `status` | `string` | Lot status: `"active"`, `"sold"`, `"settled"`, etc. |
| `image` | `string \| null` | Primary image URL — used as the thumbnail in the table |
| `auctionId` | `number \| null` | ID of the auction this lot belongs to |
| `auctionTitle` | `string \| null` | Title of that auction |

> Return exactly **5** lots, sorted descending by `currentBid`.

---

## `data.auctionPerformance` — required

List of recent/completed auctions and their performance metrics, for the performance breakdown card.

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
| `soldCount` | `number` | Lots that reached a winning bid (settled/sold) |
| `bidCount` | `number` | Total bid events placed across all lots in this auction |

> Return up to **10** most recent auctions, sorted descending by `revenue`.

---

## `data.actionsNeeded` — required

Counts of items that require admin attention. Drives the "Actions Needed" card.

```json
"actionsNeeded": {
  "pendingAuctions": 2,
  "pendingLots": 14,
  "openDisputes": 5
}
```

| Field | Type | Description |
|---|---|---|
| `pendingAuctions` | `number` | Auctions in `draft` or `pending_approval` status |
| `pendingLots` | `number` | Lots with `reviewStatus = "submitted"` waiting for admin approval |
| `openDisputes` | `number` | Open disputes requiring a response |

---

## `data.revenueBids` — optional

Time-series data for the Revenue & Bids chart. The chart has 4 period tabs.

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

| Period | Array length | `label` format | Window |
|---|---|---|---|
| `daily` | 7 | Day abbreviation: `"Mon"` … `"Sun"` | Last 7 days, oldest first |
| `weekly` | 8 | `"Wk N"` | Last 8 calendar weeks, oldest first |
| `monthly` | 12 | Month abbreviation: `"Jan"` … `"Dec"` | Last 12 calendar months, oldest first |
| `yearly` | 5 | Full year: `"2021"` | Last 5 years, oldest first |

Each point:

| Field | Type | Description |
|---|---|---|
| `label` | `string` | X-axis label |
| `revenue` | `number` | Total GHS settled in that bucket |
| `bids` | `number` | Total bid events placed in that bucket |

---

## `data.lotPipeline` — optional

Funnel counts for the Lot Approval Pipeline card. Tracks how many lots progress through each stage **this calendar month**, plus an all-time settled count.

```json
"lotPipeline": {
  "submitted": 127,
  "approved": 89,
  "live": 63,
  "settled": 51,
  "settledAllTime": 1284
}
```

| Field | Type | Description |
|---|---|---|
| `submitted` | `number` | Lots submitted by vendors this month |
| `approved` | `number` | Of those, how many were approved by admins |
| `live` | `number` | Of those approved, how many went live in an auction |
| `settled` | `number` | Of those live, how many are now settled with a winner |
| `settledAllTime` | `number` | Total settled lots across all time — shown in the footer |

> Invariant: `submitted >= approved >= live >= settled`

---

## `data.topVendors` — optional

Vendor leaderboard for the current calendar month, ranked by revenue.

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
    "trend": "up"
  },
  {
    "id": 4,
    "name": "Abena Gold & Jewels",
    "lotsSettled": 29,
    "revenue": 98700,
    "trend": "down"
  },
  {
    "id": 2,
    "name": "Dansoman Electronics",
    "lotsSettled": 51,
    "revenue": 76200,
    "trend": "up"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Vendor user ID |
| `name` | `string` | Vendor display name |
| `lotsSettled` | `number` | Lots settled by this vendor this month |
| `revenue` | `number` | Total GHS revenue from their settled lots this month |
| `trend` | `"up" \| "down"` | `"up"` if this month's revenue > last month's, `"down"` otherwise |

> Return up to **5** vendors, sorted descending by `revenue`. If fewer than 5 vendors have activity this month, return however many do — do not pad with zeros.

---

## Complete response shape (reference)

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
        "image": string | null,
        "auctionId": number | null,
        "auctionTitle": string | null
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
    },
    "revenueBids": {
      "daily":   [ { "label": string, "revenue": number, "bids": number } ],
      "weekly":  [ { "label": string, "revenue": number, "bids": number } ],
      "monthly": [ { "label": string, "revenue": number, "bids": number } ],
      "yearly":  [ { "label": string, "revenue": number, "bids": number } ]
    },
    "lotPipeline": {
      "submitted": number,
      "approved": number,
      "live": number,
      "settled": number,
      "settledAllTime": number
    },
    "topVendors": [
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

## Notes

- **Authentication**: endpoint requires a valid admin bearer token. Return `401` for missing/invalid tokens, `403` for non-admin roles.
- **Performance**: this endpoint is polled every 5 minutes by the dashboard. Aggregate queries should be cached or pre-computed (e.g. materialized view or Redis cache with a 60-second TTL) — do not run raw heavy aggregates on every request.
- **Currency**: all monetary values are in **GHS** (Ghanaian cedi), as plain numbers (no currency symbol or formatting).
- **Timezone**: use **UTC** for all date bucketing unless a `tz` query param is supported.
- **Empty states**: return `[]` for arrays with no data (not `null`). Return `0` for numeric counts with no data (not `null`).
