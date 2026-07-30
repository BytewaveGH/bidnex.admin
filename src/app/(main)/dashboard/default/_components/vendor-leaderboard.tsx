import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type { TopVendor } from "./overview";

interface Props {
  topVendors?: TopVendor[];
  isLoading?: boolean;
}

export function VendorLeaderboard({ topVendors, isLoading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Vendors</CardTitle>
        <CardDescription>Ranked by total revenue this month</CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto px-0 max-h-52 scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40">
        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                <Skeleton className="size-6 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="shrink-0 space-y-1.5 text-right">
                  <Skeleton className="ml-auto h-3.5 w-20" />
                  <Skeleton className="ml-auto h-3 w-6" />
                </div>
              </div>
            ))}
          </div>
        ) : !topVendors || topVendors.length === 0 ? (
          <p className="px-6 py-4 text-muted-foreground text-sm">No vendor data yet.</p>
        ) : (
          topVendors.map((vendor, index) => (
            <div key={vendor.id}>
              <div className="flex items-center gap-3 px-6 py-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-xs">
                  #{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{vendor.name}</p>
                  <p className="text-muted-foreground text-xs">{vendor.lotsSettled} lots settled</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-sm tabular-nums">GHS {vendor.revenue.toLocaleString()}</p>
                  <div className="mt-0.5 flex justify-end">
                    {vendor.trend === "up" ? (
                      <TrendingUp className="size-3.5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="size-3.5 text-destructive" />
                    )}
                  </div>
                </div>
              </div>
              {index < topVendors.length - 1 && <Separator />}
            </div>
          ))
        )}
        <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </CardContent>
    </Card>
  );
}
