export const AnalyticsServices = {
  // GET /admin/analytics?from=&to=
  FetchAll: (params?: { from?: string; to?: string }) => ({
    method: 'GET',
    url: '/admin/analytics',
    params,
  }),

  // GET /admin/analytics/daily?from=&to=
  // Returns: DailyPoint[] — day label, revenue, profit per day
  FetchDailyRevenue: (params?: { from?: string; to?: string }) => ({
    method: 'GET',
    url: '/admin/analytics/daily',
    params,
  }),

  // GET /admin/analytics/monthly
  // Returns: MonthlyPoint[] — month label and revenue for the last 12 months
  FetchMonthlyRevenue: () => ({
    method: 'GET',
    url: '/admin/analytics/monthly',
  }),

  // GET /admin/analytics/hourly?from=&to=
  // Returns: HourlyPoint[] — hour label (e.g. "7am"), revenue, bid count
  FetchHourlyActivity: (params?: { from?: string; to?: string }) => ({
    method: 'GET',
    url: '/admin/analytics/hourly',
    params,
  }),

  // GET /admin/analytics/heatmap?from=&to=
  // Returns: number[][] — 7 rows (Mon–Sun) × 14 columns (7am–8pm) bid counts
  FetchHeatmap: (params?: { from?: string; to?: string }) => ({
    method: 'GET',
    url: '/admin/analytics/heatmap',
    params,
  }),

  // GET /admin/analytics/payments?from=&to=
  // Returns: PaymentSplit[] — method name, total amount, percentage share
  FetchPaymentMethods: (params?: { from?: string; to?: string }) => ({
    method: 'GET',
    url: '/admin/analytics/payments',
    params,
  }),

  // GET /admin/analytics/auctions-performance?from=&to=
  // Returns: AuctionPerf[] — per-auction revenue, share %, lot count, bid count
  FetchAuctionPerformance: (params?: { from?: string; to?: string }) => ({
    method: 'GET',
    url: '/admin/analytics/auctions-performance',
    params,
  }),

  // GET /admin/analytics/top-lots?from=&to=&page=&limit=
  // Returns: { items: TopLot[], total: number }
  FetchTopLots: (params?: { from?: string; to?: string; page?: number; limit?: number }) => ({
    method: 'GET',
    url: '/admin/analytics/top-lots',
    params,
  }),
}
