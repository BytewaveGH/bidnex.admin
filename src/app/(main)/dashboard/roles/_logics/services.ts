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
    return { endpoint: "/admin/roles" };
  },
  FetchPermissions() {
    return { endpoint: "/admin/roles/permissions" };
  },
  FetchById(id: number) {
    return { endpoint: `/admin/roles/${id}` };
  },
  Create(payload: CreateRolePayload) {
    return { endpoint: "/admin/roles", method: "POST" as const, body: payload };
  },
  Update(id: number, payload: UpdateRolePayload) {
    return { endpoint: `/admin/roles/${id}`, method: "PUT" as const, body: payload };
  },
  Delete(id: number) {
    return { endpoint: `/admin/roles/${id}`, method: "DELETE" as const };
  },
  FetchUserRoles(userId: number) {
    return { endpoint: `/admin/users/${userId}/roles` };
  },
  AssignRole(userId: number, roleId: number) {
    return {
      endpoint: `/admin/users/${userId}/roles`,
      method: "POST" as const,
      body: { roleId },
    };
  },
  RemoveRole(userId: number, roleId: number) {
    return {
      endpoint: `/admin/users/${userId}/roles/${roleId}`,
      method: "DELETE" as const,
    };
  },
};
