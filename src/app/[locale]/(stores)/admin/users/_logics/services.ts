import { IWalletCreditPayload } from '@/types/interfaces/gems-bid'

export const UserAdminServices = {
  FetchAll: (params?: Record<string, any>) => ({
    method: 'GET',
    url: '/admin/users',
    params,
  }),
  FetchById: (id: number) => ({
    method: 'GET',
    url: `/admin/users/${id}`,
  }),
  Suspend: (id: number) => ({
    method: 'PUT',
    url: `/admin/users/${id}/suspend`,
  }),
  Activate: (id: number) => ({
    method: 'PUT',
    url: `/admin/users/${id}/activate`,
  }),
  CreditWallet: (id: number, payload: IWalletCreditPayload) => ({
    method: 'POST',
    url: `/admin/users/${id}/wallet/credit`,
    data: payload,
  }),
}
