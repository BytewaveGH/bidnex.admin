export interface FetchLotsParams {
  search?: string;
  condition?: string;
  reviewStatus?: string;
  page: number;
  limit: number;
}

export interface FetchUnassignedLotsParams {
  categoryId?: string;
  recycled?: boolean;
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
  FetchUnassigned(params: FetchUnassignedLotsParams) {
    return {
      endpoint: "/admin/lots/unassigned",
      params: params as unknown as Record<string, string | number | boolean | undefined>,
    };
  },
  FetchStats() {
    return { endpoint: "/admin/lots/stats" };
  },
  UpdatePricing(id: number) {
    return { endpoint: `/admin/lots/${id}/pricing` };
  },
  ApproveLot(id: number) {
    return { endpoint: `/admin/lots/${id}/approve` };
  },
  FeatureLot(id: number, featured: boolean) {
    return { endpoint: `/admin/lots/${id}/feature`, body: { featured } };
  },
};
