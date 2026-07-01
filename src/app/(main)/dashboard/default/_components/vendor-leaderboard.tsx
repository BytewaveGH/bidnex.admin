import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { TopVendor } from "./overview";

interface Props {
  topVendors?: TopVendor[];
}

const mockVendors = [
  { rank: 1, name: "Accra Luxury Traders", lots: 42, revenue: 187500, trend: "up" as const },
  { rank: 2, name: "TechHub Ghana Ltd.", lots: 67, revenue: 142300, trend: "up" as const },
  { rank: 3, name: "Abena Gold & Jewels", lots: 29, revenue: 98700, trend: "down" as const },
  { rank: 4, name: "Dansoman Electronics", lots: 51, revenue: 76200, trend: "up" as const },
];

export function VendorLeaderboard({ topVendors }: Props) {
  const hasReal = topVendors && topVendors.length > 0;

  const vendors = hasReal
    ? topVendors.map((v, i) => ({
        rank: i + 1,
        name: v.name,
        lots: v.lotsSettled,
        revenue: v.revenue,
        trend: v.trend,
      }))
    : mockVendors;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Vendors</CardTitle>
        <CardDescription>Ranked by total revenue this month</CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto px-0 max-h-52 scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40">
        {vendors.length === 0 ? (
          <p className="px-6 py-4 text-muted-foreground text-sm">No vendor data yet.</p>
        ) : (
          vendors.map((vendor, index) => (
            <div key={vendor.rank}>
              <div className="flex items-center gap-3 px-6 py-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground text-xs">
                  #{vendor.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{vendor.name}</p>
                  <p className="text-muted-foreground text-xs">{vendor.lots} lots settled</p>
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
              {index < vendors.length - 1 && <Separator />}
            </div>
          ))
        )}
        <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </CardContent>
    </Card>
  );
}
