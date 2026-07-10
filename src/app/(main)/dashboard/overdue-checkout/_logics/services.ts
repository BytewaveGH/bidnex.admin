export interface FetchOverdueLotsParams {
  search?: string;
  page: number;
  limit: number;
}

export const OverdueCheckoutServices = {
  FetchAll(params: FetchOverdueLotsParams) {
    return {
      endpoint: "/admin/lots/overdue-checkout",
      params: params as unknown as Record<string, string | number | undefined>,
    };
  },
  RelistLot(id: number) {
    return {
      endpoint: `/admin/lots/${id}/relist`,
      method: "POST" as const,
    };
  },
};
