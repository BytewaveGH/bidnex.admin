export namespace IAnalytics {
  export interface Response {
    totalUsers: number
    totalAuctions: number
    activeAuctions: number
    totalBidsToday: number
    totalRevenue: number
    openDisputes: number
  }

  // GET /admin/analytics/daily → [{date, revenue, bids}]
  export interface DailyPoint {
    date: string
    revenue: number
    bids: number
  }

  // GET /admin/analytics/monthly → [{month, revenue, bids}]
  export interface MonthlyPoint {
    month: string
    revenue: number
    bids: number
  }

  // GET /admin/analytics/hourly → [{hour, revenue, bids}]
  export interface HourlyPoint {
    hour: string
    revenue: number
    bids: number
  }

  // GET /admin/analytics/heatmap → [{day, hour, bids}] (day: 0=Mon…6=Sun, hour: 0=7am…13=8pm)
  export interface HeatmapPoint {
    day: number
    hour: number
    bids: number
  }

  // GET /admin/analytics/payments → {total, methods: PaymentMethod[]}
  export interface PaymentMethod {
    method: string
    amount: number
    pct: number
  }
  export interface PaymentsResponse {
    total: number
    methods: PaymentMethod[]
  }

  // GET /admin/analytics/auctions-performance → [{name, revenue, pct, lots, bids}]
  export interface AuctionPerf {
    name: string
    revenue: number
    pct: number
    lots: number
    bids: number
  }

  // GET /admin/analytics/top-lots → TopLot[] (top 16, sorted by revenue)
  export interface TopLot {
    name: string
    auction: string
    bids: number
    revenue: number
    margin: number
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
