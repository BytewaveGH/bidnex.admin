import { PayoutStatus } from '@/types/interfaces/gems-bid'

export const FinanceServices = {
  FetchStats: () => ({
    method: 'GET',
    url: '/admin/finance/stats',
  }),

  FetchPayouts: (params?: { status?: PayoutStatus | ''; limit?: number; offset?: number }) => ({
    method: 'GET',
    url: '/admin/finance/payouts',
    params,
  }),

  FetchPayoutById: (id: number) => ({
    method: 'GET',
    url: `/admin/finance/payouts/${id}`,
  }),

  RetryPayout: (id: number) => ({
    method: 'PUT',
    url: `/admin/finance/payouts/${id}/retry`,
  }),

  FetchVendorPayouts: (vendorId: number, params?: { limit?: number; offset?: number }) => ({
    method: 'GET',
    url: `/admin/vendors/${vendorId}/payouts`,
    params,
  }),
}
