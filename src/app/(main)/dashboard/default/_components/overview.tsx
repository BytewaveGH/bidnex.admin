"use client";
"use no memo";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { apiRequest } from "@/lib/api-client";

import { AnalyticsServices } from "../_logics/services";
import { ActionsNeeded } from "./actions-needed";
import { AuctionPerformance } from "./auction-performance";
import { AuctionStatsCards } from "./auction-stats-cards";
import { LotApprovalFunnel } from "./lot-approval-funnel";
import { RevenueBidsChart } from "./revenue-bids-chart";
import { TopLotsTable } from "./top-lots-table";
import { VendorLeaderboard } from "./vendor-leaderboard";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AnalyticsKpis {
  totalRevenue: number;
  revenueChange: number;
  activeAuctions: number;
  bidsToday: number;
  openDisputes: number;
  totalUsers: number;
}

export interface TopLot {
  id: number;
  title: string;
  startingBid: number;
  currentBid: number;
  bidCount: number;
  margin: number;
  status: string;
  image?: string;
  auctionId?: number;
  auctionTitle?: string;
}

export interface AuctionPerf {
  id: number;
  title: string;
  revenue: number;
  lotsCount: number;
  soldCount: number;
  bidCount: number;
}

export interface ActionsNeededData {
  pendingAuctions: number;
  pendingLots: number;
  openDisputes: number;
}

export interface RevenueBidPoint {
  label: string;
  revenue: number;
  bids: number;
}

export interface RevenueBidsPeriods {
  daily: RevenueBidPoint[];
  weekly: RevenueBidPoint[];
  monthly: RevenueBidPoint[];
  yearly: RevenueBidPoint[];
}

export interface LotPipeline {
  submitted: number;
  approved: number;
  live: number;
  settled: number;
  settledAllTime: number;
}

export interface TopVendor {
  id: number;
  name: string;
  lotsSettled: number;
  revenue: number;
  trend: "up" | "down";
}

export interface AnalyticsInsights {
  revenueVsPrevPeriod: number;
  avgBidsPerLot: number;
  disputeRate: number;
  topAuction: string;
  topAuctionRevenue: number;
  peakHour: number;
  newUsersInPeriod: number;
}

interface AnalyticsResponse {
  kpis: AnalyticsKpis;
  topLots: TopLot[];
  auctionPerformance: AuctionPerf[];
  actionsNeeded: ActionsNeededData;
  revenueBids?: RevenueBidsPeriods;
  lotPipeline?: LotPipeline;
  topVendors?: TopVendor[];
  insights?: AnalyticsInsights;
}

function normalise(res: unknown): AnalyticsResponse | null {
  const r = res as { data?: AnalyticsResponse; status?: boolean };
  return r?.data ?? null;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Overview() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data: raw } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => apiRequest(AnalyticsServices.Fetch().endpoint, token),
    enabled: sessionStatus === "authenticated",
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const analytics = normalise(raw);

  return (
    <div className="flex flex-col gap-4">
      <AuctionStatsCards kpis={analytics?.kpis} lotPipeline={analytics?.lotPipeline} />
      <RevenueBidsChart revenueBids={analytics?.revenueBids} />
      <TopLotsTable lots={analytics?.topLots} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AuctionPerformance auctions={analytics?.auctionPerformance} />
        <ActionsNeeded actionsNeeded={analytics?.actionsNeeded} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LotApprovalFunnel lotPipeline={analytics?.lotPipeline} />
        <VendorLeaderboard topVendors={analytics?.topVendors} />
      </div>
    </div>
  );
}
