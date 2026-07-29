export interface ICategoryPayload {
  name: string;
  description?: string;
  iconUrl?: string;
  parentId: number | null;
}

export const CategoryServices = {
  FetchAll() {
    return { endpoint: "/api/admin/categories" };
  },
  Create(payload: ICategoryPayload) {
    return { endpoint: "/api/admin/categories", method: "POST" as const, body: payload };
  },
  Update(id: number, payload: ICategoryPayload) {
    return { endpoint: `/api/admin/categories/${id}`, method: "PUT" as const, body: payload };
  },
  Delete(id: number) {
    return { endpoint: `/api/admin/categories/${id}`, method: "DELETE" as const };
  },
};
