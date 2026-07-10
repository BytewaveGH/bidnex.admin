export interface OverdueLot {
  id: number;
  title: string;
  primaryImage?: string;
  currentBid: number;
  status: string;
  // Winner
  winnerId?: number;
  winnerName?: string;
  winnerEmail?: string;
  winnerPhone?: string;
  // Auction
  auctionId?: number;
  auctionTitle?: string;
  endTime?: string;
  // Checkout
  checkoutDeadline?: string;
  hoursOverdue?: number;
  createdAt: string;
}
