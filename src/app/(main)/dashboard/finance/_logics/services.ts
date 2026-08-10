export interface FinanceStats {
  totalVolume: number;
  totalPlatformFees: number;
  totalTransferred: number;
  totalPayouts: number;
  successfulPayouts: number;
  failedPayouts: number;
  pendingReview: number;
}

export type PayoutStatus = "failed" | "completed" | "pending_review";

export interface FetchPayoutsParams {
  status?: PayoutStatus;
  page: number;
  limit: number;
}

export interface Payout {
  id: number;
  lotId: number;
  lotTitle: string;
  vendorId: number;
  vendorName: string;
  grossAmount: number;
  platformCharge: number;
  transferAmount: number;
  status: PayoutStatus;
  failureReason?: string;
  createdAt: string;
}

export const FinanceServices = {
  FetchStats() {
    return { endpoint: "/api/admin/finance/stats" };
  },
  FetchPayouts(params: FetchPayoutsParams) {
    return {
      endpoint: "/api/admin/finance/payouts",
      params: params as unknown as Record<string, string | number | undefined>,
    };
  },
};
