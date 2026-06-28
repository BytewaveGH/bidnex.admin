import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const bids = [
  {
    id: 1,
    bidder: "Bidder #4821",
    lotTitle: "Rolex Submariner Date (1985)",
    amount: 4800,
    previous: 4600,
    timeAgo: "just now",
  },
  {
    id: 2,
    bidder: "Bidder #2047",
    lotTitle: "Apple iPhone 15 Pro Max 256GB",
    amount: 3100,
    previous: 2950,
    timeAgo: "1 min ago",
  },
  {
    id: 3,
    bidder: "Bidder #9312",
    lotTitle: "22k Gold Rope Necklace Set",
    amount: 2200,
    previous: 2050,
    timeAgo: "2 min ago",
  },
  {
    id: 4,
    bidder: "Bidder #1183",
    lotTitle: "Rolex Submariner Date (1985)",
    amount: 4600,
    previous: 4400,
    timeAgo: "4 min ago",
  },
  {
    id: 5,
    bidder: "Bidder #7754",
    lotTitle: "Samsung 65 QLED 4K Smart TV",
    amount: 1950,
    previous: 1800,
    timeAgo: "6 min ago",
  },
  {
    id: 6,
    bidder: "Bidder #3390",
    lotTitle: "22k Gold Rope Necklace Set",
    amount: 2050,
    previous: 1900,
    timeAgo: "8 min ago",
  },
  {
    id: 7,
    bidder: "Bidder #5516",
    lotTitle: "Apple iPhone 15 Pro Max 256GB",
    amount: 2950,
    previous: 2800,
    timeAgo: "11 min ago",
  },
  {
    id: 8,
    bidder: "Bidder #8872",
    lotTitle: "Simpson 4000 PSI Gas Pressure Washer",
    amount: 850,
    previous: 750,
    timeAgo: "14 min ago",
  },
];

export function RecentBidsFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 leading-none">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Recent Bids
        </CardTitle>
        <CardDescription>Live activity across all auctions</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {bids.map((bid, index) => (
          <div key={bid.id}>
            <div className="flex items-center justify-between gap-3 px-6 py-2.5">
              <div className="min-w-0">
                <p className="font-medium text-sm">{bid.bidder}</p>
                <p className="max-w-[180px] truncate text-muted-foreground text-xs">{bid.lotTitle}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-medium text-emerald-600 text-sm tabular-nums dark:text-emerald-400">
                  GHS {bid.amount.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-xs">
                  +GHS {(bid.amount - bid.previous).toLocaleString()} · {bid.timeAgo}
                </p>
              </div>
            </div>
            {index < bids.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
