export interface FetchLotsParams {
  search?: string;
  condition?: string;
  reviewStatus?: string;
  page: number;
  limit: number;
}

export const VendorLotServices = {
  FetchAll(params: FetchLotsParams) {
    return {
      endpoint: "/admin/lots",
      params: params as unknown as Record<string, string | number | undefined>,
    };
  },
  FetchStats() {
    return { endpoint: "/admin/lots/stats" };
  },
};
