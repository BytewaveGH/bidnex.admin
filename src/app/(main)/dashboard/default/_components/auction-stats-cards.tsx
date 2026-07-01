import { Gavel, Package, TrendingDown, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api-client";

interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  totalLots: number;
  liveBids: number;
}

interface AuctionStatsResponse {
  data: AuctionStats;
  status: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{value ?? "—"}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

import { Badge } from "@/components/ui/badge";

import type { AnalyticsKpis, LotPipeline } from "./overview";

interface Props {
  kpis?: AnalyticsKpis;
  lotPipeline?: LotPipeline;
}

export function AuctionStatsCards({ kpis, lotPipeline }: Props) {
  const settledAllTime = lotPipeline?.settledAllTime ?? 1284;
  const liveAuctions = kpis?.activeAuctions ?? 47;
  const totalUsers = kpis?.totalUsers ?? 0;
  const bidsToday = kpis?.bidsToday ?? 312;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Package className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Settled Lots</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {settledAllTime.toLocaleString()}
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Completed auctions all time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Gavel className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Live Auctions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {liveAuctions.toLocaleString()}
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Active right now</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Users className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Total Users</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {totalUsers.toLocaleString()}
            </div>
            {(kpis?.revenueChange ?? 0) !== 0 && (
              <Badge variant={(kpis?.revenueChange ?? 0) >= 0 ? "default" : "destructive"}>
                {(kpis?.revenueChange ?? 0) >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(kpis?.revenueChange ?? 0)}%
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Registered on the platform</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Gavel className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Active Bidders Today</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {bidsToday.toLocaleString()}
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Bids placed in the last 24h</p>
        </CardContent>
      </Card>
    </div>
  );
}
