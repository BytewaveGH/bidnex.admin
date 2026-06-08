import { IDisputeResolvePayload } from '@/types/interfaces/gems-bid'

export const DisputeServices = {
  FetchAll: (params?: Record<string, any>) => ({
    method: 'GET',
    url: '/admin/disputes',
    params,
  }),
  FetchById: (id: number) => ({
    method: 'GET',
    url: `/admin/disputes/${id}`,
  }),
  Resolve: (id: number, payload: IDisputeResolvePayload) => ({
    method: 'PUT',
    url: `/admin/disputes/${id}/resolve`,
    data: payload,
  }),
}
