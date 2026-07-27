# `GET /api/admin/analytics/operations` — Analytics Sections Endpoint Specification

This endpoint powers the Analytics tab sections on the main dashboard:
**Platform Earnings · Fee Breakdown · Revenue by Category · Avg. Winning Bid · Bidder Activity · Conversion Funnel · Vendor Performance · User Analytics**

These are completely separate from `GET /api/admin/analytics` (overview) and `GET /api/admin/analytics/platform` (traffic/engagement). Do not modify those.

---

## Query parameters

None. All period-level breakdowns (daily / weekly / monthly) must be pre-computed server-side and returned together — the frontend switches between them client-side with no additional API calls.

---

## Response envelope

```json
{
  "status": true,
  "data": { ... }
}
```

---

## `data.earnings` — required

Powers the **Platform Earnings** card. Four summary tiles followed by a fee breakdown list.

### `data.earnings.summary` — 4 tiles

```json
"summary": {
  "grossRevenue":                 549300,
  "grossRevenueChange":           14.2,
  "platformFee":                  27465,
  "platformFeeRate":              5,
  "vendorPayouts":                521835,
  "vendorPayoutsChange":          14.1,
  "pendingReconciliation":        8240,
  "pendingReconciliationLotCount": 3
}
```

| Field | Type | Description |
|---|---|---|
| `grossRevenue` | `number` | Total GHS revenue from settled lots this calendar month |
| `grossRevenueChange` | `number` | Percentage change vs last month (positive = up) |
| `platformFee` | `number` | Total platform fees collected this month (GHS). Typically `grossRevenue × platformFeeRate / 100` |
| `platformFeeRate` | `number` | The platform fee percentage (e.g. `5` for 5%) — shown in the tile label |
| `vendorPayouts` | `number` | Total paid / owed to vendors this month (GHS): `grossRevenue − platformFee` |
| `vendorPayoutsChange` | `number` | Percentage change vs last month |
| `pendingReconciliation` | `number` | GHS value of settled lots not yet reconciled/paid out |
| `pendingReconciliationLotCount` | `number` | Number of lots contributing to the pending amount — shown in the change badge |

### `data.earnings.breakdown` — fee breakdown by category

```json
"breakdown": [
  { "category": "Watches",      "fees": 9375, "pct": 34 },
  { "category": "Electronics",  "fees": 7115, "pct": 26 },
  { "category": "Jewellery",    "fees": 4935, "pct": 18 },
  { "category": "Home/Kitchen", "fees": 2705, "pct": 10 },
  { "category": "Other",        "fees": 3335, "pct": 12 }
]
```

| Field | Type | Description |
|---|---|---|
| `category` | `string` | Lot category name |
| `fees` | `number` | Total platform fees (GHS) collected from this category this month |
| `pct` | `number` | This category's share of total fees (0–100, integer). Must sum to 100 across all rows |

> Return all categories with fee activity this month, sorted descending by `fees`. Lump the tail into `"Other"` so the list stays readable (5–7 rows max).

---

## `data.revenueByCategory` — required

Powers the **Revenue by Category** donut chart. The frontend computes percentages client-side — return raw GHS values only.

```json
"revenueByCategory": [
  { "name": "Watches",      "value": 187500 },
  { "name": "Electronics",  "value": 142300 },
  { "name": "Jewellery",    "value": 98700  },
  { "name": "Home/Kitchen", "value": 54100  },
  { "name": "Photography",  "value": 38600  },
  { "name": "Other",        "value": 28400  }
]
```

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Category display name |
| `value` | `number` | Total GHS settled revenue from lots in this category, current month |

> Return all categories with revenue, sorted descending by `value`. Tail categories may be grouped into `"Other"`.

---

## `data.avgBidTrend` — required

Powers the **Avg. Winning Bid** area + line chart. Three period tabs — all arrays returned at once.

```json
"avgBidTrend": {
  "daily": [
    { "label": "Mon", "avgBid": 3200, "topBid": 5800 },
    { "label": "Tue", "avgBid": 2950, "topBid": 4700 },
    { "label": "Wed", "avgBid": 3410, "topBid": 6100 },
    { "label": "Thu", "avgBid": 2880, "topBid": 5200 },
    { "label": "Fri", "avgBid": 3640, "topBid": 7400 },
    { "label": "Sat", "avgBid": 4120, "topBid": 8600 },
    { "label": "Sun", "avgBid": 3780, "topBid": 7100 }
  ],
  "weekly": [
    { "label": "Wk 1", "avgBid": 2840, "topBid": 5200 },
    ...
  ],
  "monthly": [
    { "label": "Jan", "avgBid": 2840, "topBid": 5200 },
    ...
    { "label": "Dec", "avgBid": 4650, "topBid": 9200 }
  ]
}
```

| Period | Length | `label` format | Window |
|---|---|---|---|
| `daily` | 7 | Day abbreviation: `"Mon"` … `"Sun"` | Last 7 days, oldest first |
| `weekly` | 8 | `"Wk N"` | Last 8 calendar weeks, oldest first |
| `monthly` | 12 | Month abbreviation: `"Jan"` … `"Dec"` | Last 12 calendar months, oldest first |

Each point:

| Field | Type | Description |
|---|---|---|
| `label` | `string` | X-axis display label |
| `avgBid` | `number` | Average winning bid (GHS) across all settled lots in that bucket |
| `topBid` | `number` | Highest single winning bid (GHS) in that bucket |

> If a bucket has no settled lots, return `avgBid: 0` and `topBid: 0`. Do not omit the row.

---

## `data.bidderActivity` — required

Powers the **Bidder Activity** grouped bar chart. Two period tabs — both arrays returned at once.

```json
"bidderActivity": {
  "weekly": [
    { "label": "Wk 1", "newBidders": 88,  "returning": 210 },
    { "label": "Wk 2", "newBidders": 104, "returning": 248 },
    { "label": "Wk 3", "newBidders": 76,  "returning": 195 },
    { "label": "Wk 4", "newBidders": 118, "returning": 271 },
    { "label": "Wk 5", "newBidders": 92,  "returning": 224 },
    { "label": "Wk 6", "newBidders": 131, "returning": 308 },
    { "label": "Wk 7", "newBidders": 97,  "returning": 241 },
    { "label": "Wk 8", "newBidders": 108, "returning": 262 }
  ],
  "monthly": [
    { "label": "Jan", "newBidders": 312, "returning": 480 },
    ...
    { "label": "Dec", "newBidders": 694, "returning": 880 }
  ]
}
```

| Period | Length | Window |
|---|---|---|
| `weekly` | 8 | Last 8 calendar weeks, oldest first |
| `monthly` | 12 | Last 12 calendar months, oldest first |

Each point:

| Field | Type | Description |
|---|---|---|
| `label` | `string` | X-axis display label |
| `newBidders` | `number` | Users placing their first ever bid in that bucket |
| `returning` | `number` | Users who had bid before and placed a bid in that bucket |

---

## `data.conversionFunnel` — required

Powers the **Auction Conversion Funnel** horizontal bar chart. Seven fixed stages, ordered top-to-bottom representing the lot journey.

```json
"conversionFunnel": {
  "overallPct": 25.6,
  "stages": [
    { "label": "Lots Listed",           "count": 1840, "stepPct": 100 },
    { "label": "Submitted for Review",  "count": 1420, "stepPct": 77  },
    { "label": "Approved",              "count": 1102, "stepPct": 78  },
    { "label": "Went Live",             "count": 986,  "stepPct": 89  },
    { "label": "Received Bids",         "count": 768,  "stepPct": 78  },
    { "label": "Reserve Met",           "count": 492,  "stepPct": 64  },
    { "label": "Settled",               "count": 471,  "stepPct": 96  }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `overallPct` | `number` | End-to-end conversion rate: `round(settled / listed × 100, 1)`. Rendered in the footer as `"Overall conversion: X% (Lots Listed → Settled)"` |
| `stages[].label` | `string` | Stage display name — use exactly these 7 labels in this order |
| `stages[].count` | `number` | Lot count at this stage, all time (or current month — be consistent) |
| `stages[].stepPct` | `number` | Step-over-step conversion rate (integer): `round(this_stage / previous_stage × 100)`. First stage is always `100` |

> Always return exactly **7 stages** in this order. If a stage has 0 lots, return `count: 0` and compute `stepPct` as `0`.

---

## `data.vendorPerformance` — required

Powers the **Vendor Performance** table. Scope: all vendors with activity in the current calendar month.

```json
"vendorPerformance": [
  {
    "id":            3,
    "name":          "Accra Luxury Traders",
    "submitted":     58,
    "approvalRate":  91,
    "avgFinalPrice": 4464,
    "totalRevenue":  187500,
    "status":        "active"
  },
  {
    "id":            7,
    "name":          "TechHub Ghana Ltd.",
    "submitted":     82,
    "approvalRate":  88,
    "avgFinalPrice": 2124,
    "totalRevenue":  142300,
    "status":        "active"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Vendor user ID |
| `name` | `string` | Vendor display name |
| `submitted` | `number` | Lots submitted this month |
| `approvalRate` | `number` | Percentage of submitted lots approved (0–100, integer) |
| `avgFinalPrice` | `number` | Average winning bid (GHS) across their settled lots this month |
| `totalRevenue` | `number` | Total GHS revenue from their settled lots this month |
| `status` | `"active" \| "warning" \| "inactive"` | `"active"` if `approvalRate ≥ 80`, `"warning"` if `60–79`, `"inactive"` if `< 60` |

> Return all vendors with activity this month, sorted descending by `totalRevenue`.

---

## `data.userStats` — required

Powers the **User Analytics** four-tile stat grid. Return raw numbers — the frontend handles all formatting.

```json
"userStats": {
  "totalRegisteredBidders":     4218,
  "activeBiddersThisMonth":     1342,
  "newRegistrationsThisMonth":  214,
  "newRegistrationsPrevMonth":  190,
  "newRegistrationsChange":     12.4,
  "avgBidsPerActiveUser":       7.4,
  "avgBidsPerActiveUserPrev":   6.6,
  "avgBidsPerActiveUserChange": 0.8
}
```

| Field | Type | Description |
|---|---|---|
| `totalRegisteredBidders` | `number` | All-time registered user accounts with bidder role |
| `activeBiddersThisMonth` | `number` | Bidders who placed at least one bid this calendar month |
| `newRegistrationsThisMonth` | `number` | New registrations this calendar month |
| `newRegistrationsPrevMonth` | `number` | New registrations last month — used in the sub-label `"vs. last month's X"` |
| `newRegistrationsChange` | `number` | Percentage change: `(thisMonth − prevMonth) / prevMonth × 100` |
| `avgBidsPerActiveUser` | `number` | Average bid count per active bidder this month (1 decimal) |
| `avgBidsPerActiveUserPrev` | `number` | Same metric for last month — used in sub-label `"vs. last month's X"` |
| `avgBidsPerActiveUserChange` | `number` | Absolute delta: `current − previous` (positive = up) |

---

## Complete response shape

```json
{
  "status": true,
  "data": {
    "earnings": {
      "summary": {
        "grossRevenue":                  number,
        "grossRevenueChange":            number,
        "platformFee":                   number,
        "platformFeeRate":               number,
        "vendorPayouts":                 number,
        "vendorPayoutsChange":           number,
        "pendingReconciliation":         number,
        "pendingReconciliationLotCount": number
      },
      "breakdown": [
        { "category": string, "fees": number, "pct": number }
      ]
    },
    "revenueByCategory": [
      { "name": string, "value": number }
    ],
    "avgBidTrend": {
      "daily":   [ { "label": string, "avgBid": number, "topBid": number } ],
      "weekly":  [ { "label": string, "avgBid": number, "topBid": number } ],
      "monthly": [ { "label": string, "avgBid": number, "topBid": number } ]
    },
    "bidderActivity": {
      "weekly":  [ { "label": string, "newBidders": number, "returning": number } ],
      "monthly": [ { "label": string, "newBidders": number, "returning": number } ]
    },
    "conversionFunnel": {
      "overallPct": number,
      "stages": [
        { "label": string, "count": number, "stepPct": number }
      ]
    },
    "vendorPerformance": [
      {
        "id":            number,
        "name":          string,
        "submitted":     number,
        "approvalRate":  number,
        "avgFinalPrice": number,
        "totalRevenue":  number,
        "status":        "active" | "warning" | "inactive"
      }
    ],
    "userStats": {
      "totalRegisteredBidders":      number,
      "activeBiddersThisMonth":      number,
      "newRegistrationsThisMonth":   number,
      "newRegistrationsPrevMonth":   number,
      "newRegistrationsChange":      number,
      "avgBidsPerActiveUser":        number,
      "avgBidsPerActiveUserPrev":    number,
      "avgBidsPerActiveUserChange":  number
    }
  }
}
```

---

## Notes

- **Auth**: requires a valid admin Bearer token. Return `401` for missing/invalid, `403` for non-admin.
- **Scope**: all monetary values are in **GHS** as plain numbers — no symbol or formatting.
- **Month boundary**: "this month" and "last month" use UTC calendar month boundaries unless a timezone is passed.
- **Conversion funnel scope**: decide whether stages count all-time lots or current-month lots and be consistent across all seven stages. All-time is recommended since lot counts will be very low in early months.
- **Empty arrays**: return `[]` — never `null` — for any array with no data. Return `0` for numeric counts.
- **`breakdown` pct sum**: the `pct` values across all rows in `earnings.breakdown` must sum to exactly `100`. Round individual values and adjust the last row to compensate for rounding drift.
- **Caching**: aggregate queries here are expensive. Cache this response for 2–5 minutes server-side. Do not run raw aggregates on every request.
