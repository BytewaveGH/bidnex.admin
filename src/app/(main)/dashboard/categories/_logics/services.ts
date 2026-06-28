export interface ICategoryPayload {
  name: string;
  description?: string;
  iconUrl?: string;
  parentId: number | null;
}

export const CategoryServices = {
  FetchAll() {
    return { endpoint: "/admin/categories" };
  },
  Create(payload: ICategoryPayload) {
    return { endpoint: "/admin/categories", method: "POST" as const, body: payload };
  },
  Update(id: number, payload: ICategoryPayload) {
    return { endpoint: `/admin/categories/${id}`, method: "PUT" as const, body: payload };
  },
  Delete(id: number) {
    return { endpoint: `/admin/categories/${id}`, method: "DELETE" as const };
  },
};
