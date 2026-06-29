export interface FetchAuctionsParams {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface CreateAuctionBody {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  locationName: string;
  locationAddress?: string;
}

export interface AssignLotBody {
  isFeatured: boolean;
  lotInterval: number;
  lotOrder: number;
}

export interface ScheduleAuctionBody {
  startTime: string;
  lotIntervalMinutes: number;
}

export const AuctionServices = {
  FetchAll(params: FetchAuctionsParams) {
    return {
      endpoint: "/admin/auctions",
      params: params as unknown as Record<string, string | number | undefined>,
    };
  },
  CreateAuction(body: CreateAuctionBody) {
    return { endpoint: "/admin/auctions", body };
  },
  AssignLot(auctionId: number, lotId: number, body: AssignLotBody) {
    return { endpoint: `/admin/auctions/${auctionId}/lots/${lotId}`, body };
  },
  ScheduleAuction(id: number, body: ScheduleAuctionBody) {
    return { endpoint: `/admin/auctions/${id}/schedule`, body };
  },
  ApproveAuction(id: number) {
    return { endpoint: `/admin/auctions/${id}/approve` };
  },
  CancelAuction(id: number) {
    return { endpoint: `/admin/auctions/${id}/cancel` };
  },
  FetchOne(id: number) {
    return { endpoint: `/admin/auctions/${id}` };
  },
  RemoveLot(auctionId: number, lotId: number) {
    return { endpoint: `/admin/auctions/${auctionId}/lots/${lotId}` };
  },
};
