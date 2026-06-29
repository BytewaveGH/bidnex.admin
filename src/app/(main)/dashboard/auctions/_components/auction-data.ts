export interface IAuctionLotCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  createdAt: string;
}

export interface IAuctionLotImage {
  id: number;
  url: string;
  mediaType: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface IAuctionLot {
  id: number;
  vendorId: number;
  title: string;
  description: string;
  condition: string;
  startingBid: number;
  currentBid: number;
  bidIncrement: number;
  bidCount: number;
  reservePrice: number;
  buyNowPrice: number;
  status: string;
  reviewStatus: string;
  reviewRejectReason: string;
  lotOrder: number;
  bidStartTime?: string;
  bidEndTime?: string;
  sku: string;
  pickupAvailable: boolean;
  shippingAvailable: boolean;
  bidderIds: number[];
  category: IAuctionLotCategory;
  primaryImage: string;
  images: IAuctionLotImage[];
  createdAt: string;
}

export interface IAuction {
  id: number;
  title: string;
  description: string;
  status: string;
  startTime: string;
  endTime: string;
  vendorId: number;
  isFeatured: boolean;
  locationName: string;
  locationAddress: string;
  lotCount: number;
  lotInterval: number;
  createdAt: string;
  lots: IAuctionLot[];
}
