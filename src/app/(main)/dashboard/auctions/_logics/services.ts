export interface FetchAuctionsParams {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}

export const AuctionServices = {
  FetchAll(params: FetchAuctionsParams) {
    return {
      endpoint: "/admin/auctions",
      params: params as unknown as Record<string, string | number | undefined>,
    };
  },
};
