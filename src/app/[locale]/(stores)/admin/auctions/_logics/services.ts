import { IAuctionCreatePayload, IAuctionSchedulePayload } from '@/types/interfaces/gems-bid'

export const AuctionServices = {
  FetchAll: (params?: Record<string, any>) => ({
    method: 'GET',
    url: '/admin/auctions',
    params,
  }),
  GetById: (id: number) => ({
    method: 'GET',
    url: `/admin/auctions/${id}`,
  }),
  Create: (payload: IAuctionCreatePayload) => ({
    method: 'POST',
    url: '/admin/auctions',
    data: payload,
  }),
  Update: (id: number, payload: Partial<IAuctionCreatePayload>) => ({
    method: 'PUT',
    url: `/admin/auctions/${id}`,
    data: payload,
  }),
  Approve: (id: number) => ({
    method: 'PUT',
    url: `/admin/auctions/${id}/approve`,
  }),
  Reject: (id: number, payload: { reason: string }) => ({
    method: 'PUT',
    url: `/admin/auctions/${id}/reject`,
    data: payload,
  }),
  Cancel: (id: number) => ({
    method: 'PUT',
    url: `/admin/auctions/${id}/cancel`,
  }),
  Schedule: (id: number, payload: IAuctionSchedulePayload) => ({
    method: 'PUT',
    url: `/admin/auctions/${id}/schedule`,
    data: payload,
  }),
  GetLots: (id: number) => ({
    method: 'GET',
    url: `/admin/auctions/${id}/lots`,
  }),
  AssignLot: (auctionId: number, lotId: number) => ({
    method: 'POST',
    url: `/admin/auctions/${auctionId}/lots/${lotId}`,
  }),
  RemoveLot: (auctionId: number, lotId: number) => ({
    method: 'DELETE',
    url: `/admin/auctions/${auctionId}/lots/${lotId}`,
  }),
}
