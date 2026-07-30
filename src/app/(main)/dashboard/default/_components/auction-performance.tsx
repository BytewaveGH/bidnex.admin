import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type { AuctionPerf } from "./overview";

interface Props {
  auctions?: AuctionPerf[];
  isLoading?: boolean;
}

export function AuctionPerformance({ auctions, isLoading }: Props) {
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
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
              <div key={i}>
                {i > 0 && <Separator />}
                <div className="flex items-start justify-between gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !auctions || auctions.length === 0 ? (
          <p className="px-6 py-4 text-muted-foreground text-sm">No active auctions right now.</p>
        ) : (
          auctions.map((auction, i) => {
            const reserveMetPct = auction.lotsCount > 0 ? Math.round((auction.soldCount / auction.lotsCount) * 100) : 0;
            return (
              <div key={auction.id}>
                {i > 0 && <Separator />}
                <div className="flex items-start justify-between gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm" title={auction.title}>
                      {auction.title}
                    </p>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      {auction.lotsCount} lots · {auction.bidCount} bids
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-medium text-sm tabular-nums">GHS {auction.revenue.toLocaleString()}</span>
                    <Badge
                      variant="outline"
                      className={
                        reserveMetPct >= 70
                          ? "h-4 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-400"
                          : "h-4 px-1.5 text-[10px] text-muted-foreground"
                      }
                    >
                      {reserveMetPct}% reserve met
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </CardContent>
    </Card>
  );
}
