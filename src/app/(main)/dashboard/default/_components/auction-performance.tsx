import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { AuctionPerf } from "./overview";

interface Props {
  auctions?: AuctionPerf[];
}

type DisplayAuction = {
  id: number;
  name: string;
  lots: number;
  activeBids: number;
  totalBids: string;
  timeLeft?: string;
  reserveMetPct: number;
};

const mockAuctions: DisplayAuction[] = [
  {
    id: 1,
    name: "Sunday Evening Jewellery & Watches",
    lots: 18,
    activeBids: 94,
    totalBids: "GHS 48,200",
    timeLeft: "3h 20m",
    reserveMetPct: 72,
  },
  {
    id: 2,
    name: "Electronics Flash Sale #14",
    lots: 12,
    activeBids: 38,
    totalBids: "GHS 22,100",
    timeLeft: "45m",
    reserveMetPct: 50,
  },
  {
    id: 3,
    name: "Antiques & Collectibles — June Session",
    lots: 31,
    activeBids: 201,
    totalBids: "GHS 91,400",
    timeLeft: "6h 10m",
    reserveMetPct: 84,
  },
];

export function AuctionPerformance({ auctions }: Props) {
  const displayAuctions: DisplayAuction[] = auctions
    ? auctions.map((a) => ({
        id: a.id,
        name: a.title,
        lots: a.lotsCount,
        activeBids: a.bidCount,
        totalBids: `GHS ${a.revenue.toLocaleString()}`,
        reserveMetPct: a.lotsCount > 0 ? Math.round((a.soldCount / a.lotsCount) * 100) : 0,
      }))
    : mockAuctions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 leading-none">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live Auctions
        </CardTitle>
        <CardDescription>Currently active — updates in real time</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 overflow-y-auto px-0 max-h-56 scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40">
        {displayAuctions.map((auction, i) => (
          <div key={auction.id}>
            {i > 0 && <Separator />}
            <div className="flex items-start justify-between gap-3 px-6 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm" title={auction.name}>
                  {auction.name}
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {auction.lots} lots · {auction.activeBids} bids
                  {auction.timeLeft ? ` · ${auction.timeLeft} left` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-medium text-sm tabular-nums">{auction.totalBids}</span>
                <Badge
                  variant="outline"
                  className={
                    auction.reserveMetPct >= 70
                      ? "h-4 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-400"
                      : "h-4 px-1.5 text-[10px] text-muted-foreground"
                  }
                >
                  {auction.reserveMetPct}% reserve met
                </Badge>
              </div>
            </div>
          </div>
        ))}
        <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </CardContent>
    </Card>
  );
}
