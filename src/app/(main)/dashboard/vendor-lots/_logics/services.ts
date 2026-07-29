export interface FetchLotsParams {
  search?: string;
  condition?: string;
  reviewStatus?: string;
  categoryId?: string;
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
      endpoint: "/api/admin/lots",
      params: params as unknown as Record<string, string | number | undefined>,
    };
  },
  FetchUnassigned(params: FetchUnassignedLotsParams) {
    return {
      endpoint: "/api/admin/lots/unassigned",
      params: params as unknown as Record<string, string | number | boolean | undefined>,
    };
  },
  FetchStats() {
    return { endpoint: "/api/admin/lots/stats" };
  },
  UpdatePricing(id: number) {
    return { endpoint: `/api/admin/lots/${id}/pricing` };
  },
  ApproveLot(id: number) {
    return { endpoint: `/api/admin/lots/${id}/approve` };
  },
  RejectLot(id: number) {
    return { endpoint: `/api/admin/lots/${id}/reject` };
  },
  FeatureLot(id: number, featured: boolean) {
    return { endpoint: `/api/admin/lots/${id}/feature`, body: { featured } };
  },
};
