import { ICategoryPayload } from '@/types/interfaces/gems-bid'

export const CategoryServices = {
  FetchAll: () => ({
    method: 'GET',
    url: '/admin/categories',
  }),
  Create: (payload: ICategoryPayload) => ({
    method: 'POST',
    url: '/admin/categories',
    data: payload,
  }),
  Update: (id: number, payload: Partial<ICategoryPayload>) => ({
    method: 'PUT',
    url: `/admin/categories/${id}`,
    data: payload,
  }),
  Delete: (id: number) => ({
    method: 'DELETE',
    url: `/admin/categories/${id}`,
  }),
}
