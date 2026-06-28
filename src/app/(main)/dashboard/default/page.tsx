import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ActionsNeeded } from "./_components/actions-needed";
import { AnalyticsAvgBidTrend } from "./_components/analytics-avg-bid-trend";
import { AnalyticsBidderBehaviour } from "./_components/analytics-bidder-behaviour";
import { AnalyticsConversionFunnel } from "./_components/analytics-conversion-funnel";
import { AnalyticsPlatformEarnings } from "./_components/analytics-platform-earnings";
import { AnalyticsRevenueByCategory } from "./_components/analytics-revenue-by-category";
import { AnalyticsUserStats } from "./_components/analytics-user-stats";
import { AnalyticsVendorPerformance } from "./_components/analytics-vendor-performance";
import { AuctionPerformance } from "./_components/auction-performance";
import { AuctionStatsCards } from "./_components/auction-stats-cards";
import { LotApprovalFunnel } from "./_components/lot-approval-funnel";
import { RevenueBidsChart } from "./_components/revenue-bids-chart";
import { TopLotsTable } from "./_components/top-lots-table";
import { VendorLeaderboard } from "./_components/vendor-leaderboard";

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <AuctionStatsCards />
          <RevenueBidsChart />
          <TopLotsTable />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <AuctionPerformance />
            <ActionsNeeded />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <LotApprovalFunnel />
            <VendorLeaderboard />
          </div>
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
