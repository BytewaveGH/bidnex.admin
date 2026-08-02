export interface FetchFulfillmentOrdersParams {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}

export const FulfillmentServices = {
  FetchAll(params: FetchFulfillmentOrdersParams) {
    return {
      endpoint: "/admin/orders",
      params: params as unknown as Record<string, string | number | undefined>,
    };
  },
  FetchOne(lotId: number | string) {
    return { endpoint: `/admin/orders/${lotId}/fulfillment` };
  },
  FetchTimeline(orderId: number | string) {
    return { endpoint: `/admin/orders/${orderId}/timeline` };
  },
  InitiateDelivery(lotId: number | string) {
    return {
      endpoint: `/admin/orders/${lotId}/delivery/initiate`,
      method: "POST" as const,
    };
  },
  UpdateDeliveryStatus(lotId: number | string) {
    return {
      endpoint: `/admin/orders/${lotId}/delivery`,
      method: "PUT" as const,
    };
  },
  ReleaseSettlement(lotId: number | string) {
    return {
      endpoint: `/admin/orders/${lotId}/settlement`,
      method: "POST" as const,
    };
  },
};
