export interface OverdueLotCategory {
  id: number;
  name: string;
  slug?: string;
}

export interface OverdueLotImage {
  id: number;
  url: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface OverdueLot {
  id: number;
  vendorId: number;
  title: string;
  description?: string;
  condition?: string;
  startingBid: number;
  currentBid: number;
  bidIncrement?: number;
  bidCount?: number;
  reservePrice?: number;
  msrp?: number;
  buyNowPrice?: number;
  status: string;
  reviewStatus?: string;
  lotOrder?: number;
  bidStartTime?: string;
  bidEndTime?: string;
  sku?: string;
  pickupAvailable?: boolean;
  shippingAvailable?: boolean;
  isFeatured?: boolean;
  winnerId?: number;
  bidderIds?: number[];
  category?: OverdueLotCategory;
  primaryImage?: string;
  images?: OverdueLotImage[];
  createdAt: string;
  // Fields the backend may add in future
  winnerName?: string;
  winnerEmail?: string;
  winnerPhone?: string;
  auctionId?: number;
  auctionTitle?: string;
  checkoutDeadline?: string;
  hoursOverdue?: number;
}
