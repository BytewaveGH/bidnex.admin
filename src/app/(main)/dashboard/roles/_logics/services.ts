export interface CreateRolePayload {
  name: string;
  label: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  label?: string;
  description?: string;
  permissions?: string[];
}

export const RoleServices = {
  FetchAll() {
    return { endpoint: "/api/admin/roles" };
  },
  FetchPermissions() {
    return { endpoint: "/api/admin/roles/permissions" };
  },
  FetchById(id: number) {
    return { endpoint: `/api/admin/roles/${id}` };
  },
  Create(payload: CreateRolePayload) {
    return { endpoint: "/api/admin/roles", method: "POST" as const, body: payload };
  },
  Update(id: number, payload: UpdateRolePayload) {
    return { endpoint: `/api/admin/roles/${id}`, method: "PUT" as const, body: payload };
  },
  Delete(id: number) {
    return { endpoint: `/api/admin/roles/${id}`, method: "DELETE" as const };
  },
  FetchUserRoles(userId: number) {
    return { endpoint: `/api/admin/users/${userId}/roles` };
  },
  AssignRole(userId: number, roleId: number) {
    return {
      endpoint: `/api/admin/users/${userId}/roles`,
      method: "POST" as const,
      body: { roleId },
    };
  },
  RemoveRole(userId: number, roleId: number) {
    return {
      endpoint: `/api/admin/users/${userId}/roles/${roleId}`,
      method: "DELETE" as const,
    };
  },
};
