import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnalyticsAvgBidTrend } from "./_components/analytics-avg-bid-trend";
import { AnalyticsBidderBehaviour } from "./_components/analytics-bidder-behaviour";
import { AnalyticsConversionFunnel } from "./_components/analytics-conversion-funnel";
import { AnalyticsPlatformEarnings } from "./_components/analytics-platform-earnings";
import { AnalyticsRevenueByCategory } from "./_components/analytics-revenue-by-category";
import { AnalyticsUserStats } from "./_components/analytics-user-stats";
import { AnalyticsVendorPerformance } from "./_components/analytics-vendor-performance";
import { Overview } from "./_components/overview";

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <Overview />
        </TabsContent>

        <TabsContent value="analytics" className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 font-semibold text-sm">Revenue &amp; Earnings</h2>
              <Separator className="flex-1" />
            </div>
            <AnalyticsPlatformEarnings />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <AnalyticsRevenueByCategory />
              <AnalyticsAvgBidTrend />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 font-semibold text-sm">Auction Performance</h2>
              <Separator className="flex-1" />
            </div>
            <AnalyticsConversionFunnel />
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 font-semibold text-sm">Bidder Analytics</h2>
              <Separator className="flex-1" />
            </div>
            <AnalyticsBidderBehaviour />
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 font-semibold text-sm">Vendor Analytics</h2>
              <Separator className="flex-1" />
            </div>
            <AnalyticsVendorPerformance />
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="shrink-0 font-semibold text-sm">User Analytics</h2>
              <Separator className="flex-1" />
            </div>
            <AnalyticsUserStats />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
