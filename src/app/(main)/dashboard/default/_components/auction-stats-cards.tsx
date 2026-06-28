import { Gavel, Package, Target, TrendingDown, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuctionStatsCards() {
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
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">1,284</div>
            <Badge>
              <TrendingUp className="size-3" />
              +8.2%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Completed auctions this month</p>
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
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">47</div>
            <Badge>
              <TrendingUp className="size-3" />
              +3 today
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Active right now</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Target className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Reserve Met Rate</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">64%</div>
            <Badge variant="destructive">
              <TrendingDown className="size-3" />
              -3.1%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Lots that met reserve price</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Users className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Active Bidders Today</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">312</div>
            <Badge>
              <TrendingUp className="size-3" />
              +24%
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">vs. yesterday&apos;s 252</p>
        </CardContent>
      </Card>
    </div>
  );
}
