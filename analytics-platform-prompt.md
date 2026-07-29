# `GET /api/admin/analytics/platform` — Analytics Tab Endpoint Specification

This endpoint powers the dedicated **Analytics** page (`/dashboard/analytics`).
It is completely separate from `/api/admin/analytics` (the overview dashboard) — do not modify that one.

---

## Query parameter

| Param | Type | Required | Values |
|---|---|---|---|
| `range` | `string` | yes | `last-7-days` · `last-4-weeks` · `last-3-months` · `year-to-date` |

The entire response is scoped to the selected range. "Previous period" for change calculations is the same-length window immediately before the selected range.

Example:
```
GET /api/admin/analytics/platform?range=last-4-weeks
```

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

Five KPI cards shown at the top of the page.

```json
"kpis": {
  "uniqueVisitors":  { "value": 213100, "change": 2.8 },
  "sessions":        { "value": 248600, "change": 2.1 },
  "pageviews":       { "value": 547900, "change": -3.3 },
  "engagementRate":  { "value": 61.4,   "change": 4.2 },
  "conversionRate":  { "value": 8.4,    "change": -5.6 }
}
```

Each entry:

| Field | Type | Description |
|---|---|---|
| `value` | `number` | Metric total/rate for the selected range |
| `change` | `number` | Percentage change vs the previous period — positive = up, negative = down |

- `uniqueVisitors` and `sessions` and `pageviews` are raw integer counts
- `engagementRate` and `conversionRate` are percentages (0–100), not decimals

---

## `data.trafficQuality` — required

Time-series line chart comparing actual bid/engagement quality against a rolling baseline.
Returned as an array of data points ordered oldest-first across the selected range.

```json
"trafficQuality": [
  { "date": "2026-04-01T00:00:00Z", "actualQuality": 0.4,  "baselineQuality": -1.2 },
  { "date": "2026-04-01T08:00:00Z", "actualQuality": 0.1,  "baselineQuality": -0.9 },
  { "date": "2026-04-01T16:00:00Z", "actualQuality": 0.8,  "baselineQuality": -1.4 }
]
```

| Field | Type | Description |
|---|---|---|
| `date` | `string` | ISO 8601 UTC timestamp — one point every 8 hours |
| `actualQuality` | `number` | Quality score for that window (can be negative). Range roughly -6 to +6 |
| `baselineQuality` | `number` | Rolling average baseline for comparison. Same range |

> **Granularity by range:**
> - `last-7-days` → one point every 8 hours (≈ 21 points)
> - `last-4-weeks` → one point every 8 hours (≈ 84 points)
> - `last-3-months` → one point per day (≈ 90 points)
> - `year-to-date` → one point per week (≈ 52 points)

Quality score definition: `(engagedSessions - bouncedSessions) / totalSessions * 10` — or whatever internal engagement signal you have. The frontend renders whatever numbers are returned; the scale just needs to be consistent.

---

## `data.topPages` — required

Page performance table for the selected range.

```json
"topPages": [
  {
    "path": "/dashboard",
    "views": 64200,
    "avgTimeSeconds": 192,
    "bounceRate": 24.0
  },
  {
    "path": "/pricing",
    "views": 41800,
    "avgTimeSeconds": 128,
    "bounceRate": 31.0
  }
]
```

| Field | Type | Description |
|---|---|---|
| `path` | `string` | URL path (relative) |
| `views` | `number` | Pageviews in the selected range |
| `avgTimeSeconds` | `number` | Average time on page in seconds |
| `bounceRate` | `number` | Bounce rate as a percentage (0–100) |

> Return up to **10** pages, sorted descending by `views`.

---

## `data.trafficSources` — required

Traffic acquisition breakdown, split into three sub-groups for the three-tab view.

```json
"trafficSources": {
  "sources": [
    { "label": "Organic Search", "visitors": 89400 },
    { "label": "Direct",         "visitors": 55200 },
    { "label": "Social",         "visitors": 38100 },
    { "label": "Referral",       "visitors": 30400 },
    { "label": "Paid",           "visitors": 22700 }
  ],
  "campaigns": [
    { "label": "Spring Launch", "visitors": 16800 },
    { "label": "Newsletter",    "visitors": 12000 },
    { "label": "Retargeting",   "visitors":  7700 },
    { "label": "Brand Search",  "visitors":  5900 },
    { "label": "Partners",      "visitors":  4300 }
  ],
  "referrers": [
    { "label": "Google",       "visitors": 18400 },
    { "label": "LinkedIn",     "visitors":  8900 },
    { "label": "Product Hunt", "visitors":  5700 },
    { "label": "GitHub",       "visitors":  4800 },
    { "label": "Medium",       "visitors":  3600 }
  ]
}
```

Each entry:

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Display name for the traffic source / campaign / referrer |
| `visitors` | `number` | Unique visitors from that source in the selected range |

> Return up to **5** entries per sub-group, sorted descending by `visitors`.

---

## `data.vendorPerformance` — required

Vendor performance table for the selected range. Used by the Vendor Performance component.

```json
"vendorPerformance": [
  {
    "id": 3,
    "name": "Accra Luxury Traders",
    "submitted": 58,
    "approvalRate": 91.0,
    "avgFinalPrice": 4464,
    "totalRevenue": 187500,
    "status": "active"
  },
  {
    "id": 7,
    "name": "TechHub Ghana Ltd.",
    "submitted": 82,
    "approvalRate": 88.0,
    "avgFinalPrice": 2124,
    "totalRevenue": 142300,
    "status": "active"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Vendor user ID |
| `name` | `string` | Vendor display name |
| `submitted` | `number` | Lots submitted in the selected range |
| `approvalRate` | `number` | Percentage of submitted lots that were approved (0–100) |
| `avgFinalPrice` | `number` | Average winning bid (GHS) across their settled lots |
| `totalRevenue` | `number` | Total GHS revenue from their settled lots |
| `status` | `string` | `"active"` if approvalRate ≥ 80%, `"warning"` if 60–79%, `"inactive"` if < 60% |

> Return all vendors with activity in the selected range, sorted descending by `totalRevenue`.

---

## Separate endpoint: `GET /api/admin/analytics/realtime`

The Realtime Visitors card polls every 30 seconds. Keep this separate from the main endpoint to avoid blocking the full page load.

```json
{
  "status": true,
  "data": {
    "perMinute": 24,
    "minuteSeries": [
      { "minute": 1,  "visitors": 0  },
      { "minute": 2,  "visitors": 6  },
      { "minute": 3,  "visitors": 12 },
      { "minute": 30, "visitors": 4  }
    ],
    "byCountry": [
      { "countryCode": "GH", "countryName": "Ghana",         "visitors": 14 },
      { "countryCode": "GB", "countryName": "United Kingdom", "visitors": 4  },
      { "countryCode": "US", "countryName": "United States",  "visitors": 3  },
      { "countryCode": "NG", "countryName": "Nigeria",        "visitors": 3  }
    ]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `perMinute` | `number` | Current live visitors in the last 60 seconds |
| `minuteSeries` | `array` | 30 buckets — one per minute, `minute: 1` = oldest, `minute: 30` = most recent |
| `minuteSeries[].visitors` | `number` | Visitor count in that 1-minute window |
| `byCountry` | `array` | Top 4 countries by active visitors right now |
| `byCountry[].countryCode` | `string` | ISO 3166-1 alpha-2 country code (used for flag icons) |
| `byCountry[].countryName` | `string` | Full country display name |
| `byCountry[].visitors` | `number` | Active visitors from that country |

> No query params. Always returns the current 30-minute rolling window.

---

## Complete response shape for `/api/admin/analytics/platform`

```json
{
  "status": true,
  "data": {
    "kpis": {
      "uniqueVisitors":  { "value": number, "change": number },
      "sessions":        { "value": number, "change": number },
      "pageviews":       { "value": number, "change": number },
      "engagementRate":  { "value": number, "change": number },
      "conversionRate":  { "value": number, "change": number }
    },
    "trafficQuality": [
      { "date": string, "actualQuality": number, "baselineQuality": number }
    ],
    "topPages": [
      { "path": string, "views": number, "avgTimeSeconds": number, "bounceRate": number }
    ],
    "trafficSources": {
      "sources":   [ { "label": string, "visitors": number } ],
      "campaigns": [ { "label": string, "visitors": number } ],
      "referrers": [ { "label": string, "visitors": number } ]
    },
    "vendorPerformance": [
      {
        "id": number,
        "name": string,
        "submitted": number,
        "approvalRate": number,
        "avgFinalPrice": number,
        "totalRevenue": number,
        "status": "active" | "warning" | "inactive"
      }
    ]
  }
}
```

---

## Notes

- **Auth**: requires valid admin bearer token. `401` for missing/invalid, `403` for non-admin.
- **Range param**: if `range` is missing or unrecognised, default to `last-4-weeks`.
- **Currency**: all monetary values in GHS as plain numbers.
- **Empty arrays**: return `[]` — never `null` — for arrays with no data.
- **Caching**: the main endpoint can be cached for 2–5 minutes per `range` value. The realtime endpoint should never be cached.
