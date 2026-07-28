export type UserAccountType = "bidder" | "vendor" | "admin";

export interface FetchUsersParams {
  accountType?: UserAccountType;
  status?: "active" | "suspended";
  search?: string;
  limit: number;
  page: number;
}

export interface WalletCreditPayload {
  amount: number;
  description: string;
}

export const UserAdminServices = {
  FetchAll(params: FetchUsersParams) {
    return { endpoint: "/api/admin/users", params: params as unknown as Record<string, string | number | undefined> };
  },
  Suspend(id: number) {
    return { endpoint: `/api/admin/users/${id}/suspend`, method: "PUT" as const };
  },
  Activate(id: number) {
    return { endpoint: `/api/admin/users/${id}/activate`, method: "PUT" as const };
  },
  CreditWallet(id: number, payload: WalletCreditPayload) {
    return { endpoint: `/api/admin/users/${id}/wallet/credit`, method: "POST" as const, body: payload };
  },
  FetchOne(id: number) {
    return { endpoint: `/api/admin/users/${id}` };
  },
};
