export const AnalyticsServices = {
  // GET /admin/analytics?from=&to=
  // Returns: UnifiedResponse — kpis, dailyRevenue, monthlyRevenue, hourlyActivity,
  //   heatmap, topLots, auctionPerformance, actionsNeeded, insights
  FetchAll: (params?: { from?: string; to?: string }) => ({
    method: 'GET',
    url: '/admin/analytics',
    params,
  }),

  // GET /admin/analytics/payments?from=&to=
  // Returns: { total: number, methods: PaymentMethod[] }
  FetchPaymentMethods: (params?: { from?: string; to?: string }) => ({
    method: 'GET',
    url: '/admin/analytics/payments',
    params,
  }),
}
