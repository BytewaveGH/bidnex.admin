export interface FetchDisputesParams {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}

export const DisputeServices = {
  FetchAll(params: FetchDisputesParams) {
    return {
      endpoint: "/admin/disputes",
      params: params as unknown as Record<string, string | number | undefined>,
    };
  },
  FetchStats() {
    return { endpoint: "/admin/disputes/stats" };
  },
  FetchOne(id: number | string) {
    return { endpoint: `/admin/disputes/${id}` };
  },
  PostMessage(id: number | string) {
    return {
      endpoint: `/admin/disputes/${id}/messages`,
      method: "POST" as const,
    };
  },
};
