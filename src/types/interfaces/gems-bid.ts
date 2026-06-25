export namespace IAnalytics {
  export interface Kpis {
    totalRevenue: number
    revenueChange: number
    activeAuctions: number
    bidsToday: number
    openDisputes: number
    totalUsers: number
  }

  export interface DailyPoint {
    date: string
    revenue: number
    bids: number
  }

  export interface MonthlyPoint {
    month: string
    revenue: number
    bids: number
  }

  // hour is numeric 0-23
  export interface HourlyPoint {
    hour: number
    revenue: number
    bids: number
  }

  // day: 0=Mon…6=Sun, hour: 0-23
  export interface HeatmapPoint {
    day: number
    hour: number
    bids: number
  }

  export interface PaymentMethod {
    method: string
    amount: number
    pct: number
  }
  export interface PaymentsResponse {
    total: number
    methods: PaymentMethod[]
  }

  export interface AuctionPerf {
    id: number
    title: string
    revenue: number
    lotsCount: number
    soldCount: number
    bidCount: number
  }

  export interface TopLot {
    id: number
    title: string
    startingBid: number
    currentBid: number
    bidCount: number
    margin: number
    status: string
    auctionId?: number
    auctionTitle?: string
  }

  export interface Insights {
    revenueVsPrevPeriod: number
    avgBidsPerLot: number
    disputeRate: number
    topAuction: string
    topAuctionRevenue: number
    peakHour: number
    newUsersInPeriod: number
  }

  export interface ActionsNeeded {
    pendingAuctions: number
    pendingLots: number
    openDisputes: number
  }

  // GET /admin/analytics?from=&to= — unified response
  export interface UnifiedResponse {
    kpis: Kpis
    dailyRevenue: DailyPoint[]
    monthlyRevenue: MonthlyPoint[]
    hourlyActivity: HourlyPoint[]
    heatmap: HeatmapPoint[]
    topLots: TopLot[]
    auctionPerformance: AuctionPerf[]
    actionsNeeded: ActionsNeeded
    insights: Insights
  }
}

export type AuctionStatus = 'draft' | 'pending_review' | 'active' | 'ended' | 'cancelled'

export interface IAuction {
  id: number
  title: string
  description?: string
  status: AuctionStatus
  vendorId: number
  vendorName?: string
  isFeatured: boolean
  startTime?: string
  endTime?: string
  lotInterval?: number
  lotCount?: number
  rejectReason?: string
  locationName?: string
  locationAddress?: string
  createdAt: string
}

export interface ICategory {
  id: number
  name: string
  slug: string
  description?: string
  iconUrl?: string
  parentId?: number | null
  children?: ICategory[]
  createdAt: string
}

export interface ICategoryPayload {
  name: string
  description?: string
  iconUrl?: string
  parentId?: number | null
}

export type UserAccountType = 'bidder' | 'vendor' | 'admin'

export interface IAdminUser {
  id: number
  username: string
  email: string
  phone?: string
  accountType: UserAccountType
  isVerified: boolean
  createdAt: string
}

export interface IWalletCreditPayload {
  amount: number
  description: string
}

export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'resolved_refund'
  | 'resolved_partial'
  | 'resolved_store_credit'
  | 'resolved_no_action'
  | 'closed'

export type DisputeResolutionStatus = Exclude<DisputeStatus, 'open' | 'under_review'>

export interface IDisputeMessage {
  id: number
  disputeId: number
  senderId: number
  message: string
  attachments: string[]
  createdAt: string
}

export interface IDispute {
  id: number
  lotId: number
  buyerId: number
  sellerId: number
  reason: string
  description: string
  status: DisputeStatus
  outcomeNote?: string
  filedAt: string
  resolvedAt?: string
  messages?: IDisputeMessage[]
}

export interface IDisputeResolvePayload {
  status: DisputeResolutionStatus
  outcomeNote?: string
}

// ─── Lots ────────────────────────────────────────────────────────────────────

export type LotReviewStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type LotBiddingStatus = 'pending' | 'active' | 'sold' | 'unsold' | 'cancelled'

export interface ILot {
  id: number
  vendorId: number
  vendorName?: string
  title: string
  description?: string
  condition?: string
  startingBid: number
  reservePrice?: number
  currentBid?: number
  currentBidCount?: number
  reviewStatus: LotReviewStatus
  reviewRejectReason?: string
  status: LotBiddingStatus
  auctionId?: number | null
  primaryImage?: string
  lotOrder?: number
  bidStartTime?: string
  bidEndTime?: string
  createdAt: string
}

// ─── Finance / Payouts ───────────────────────────────────────────────────────

export type PayoutStatus = 'completed' | 'failed' | 'pending_review'

export interface IFinanceStats {
  totalVolume: number
  totalPlatformFees: number
  totalTransferred: number
  totalPayouts: number
  successfulPayouts: number
  failedPayouts: number
  pendingReview: number
}

export interface IPayout {
  id: number
  lotId: number
  lotTitle: string
  vendorId: number
  vendorName?: string
  grossAmount: number
  platformCharge: number
  transferAmount: number
  status: PayoutStatus
  failureReason?: string
  moolreReference?: string
  createdAt: string
}

// ─── Auction creation / scheduling ───────────────────────────────────────────

export interface IAuctionCreatePayload {
  title: string
  description?: string
  locationName?: string
  locationAddress?: string
  startTime: string
  endTime: string
  isFeatured?: boolean
}

export interface IAuctionSchedulePayload {
  startTime: string
  lotIntervalMinutes: number
}
