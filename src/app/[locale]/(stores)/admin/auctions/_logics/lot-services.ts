export const LotServices = {
  FetchByVendor: (vendorId: number, params?: Record<string, any>) => ({
    method: 'GET',
    url: '/admin/lots',
    params: { vendorId, ...params },
  }),
  FetchAll: (params?: Record<string, any>) => ({
    method: 'GET',
    url: '/admin/lots',
    params,
  }),
  FetchSubmitted: () => ({
    method: 'GET',
    url: '/admin/lots',
    params: { status: 'submitted' },
  }),
  FetchApproved: () => ({
    method: 'GET',
    url: '/admin/lots',
    params: { status: 'approved' },
  }),
  GetById: (id: number) => ({
    method: 'GET',
    url: `/admin/lots/${id}`,
  }),
  Approve: (id: number) => ({
    method: 'PUT',
    url: `/admin/lots/${id}/approve`,
  }),
  Reject: (id: number, payload: { reason: string }) => ({
    method: 'PUT',
    url: `/admin/lots/${id}/reject`,
    data: payload,
  }),
}
