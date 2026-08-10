"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { FinanceServices, type FinanceStats } from "../_logics/services";

interface ApiStatsResponse {
  data?: FinanceStats;
  status?: boolean;
}

function formatCurrency(amount: number) {
  return `GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function OverviewKpis() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: () => {
      const svc = FinanceServices.FetchStats();
      return apiRequest<ApiStatsResponse>(svc.endpoint, token);
    },
    enabled: sessionStatus === "authenticated",
  });

  const stats = data?.data;

  const transferredPct = stats ? pct(stats.totalTransferred, stats.totalVolume) : 0;
  const feePct = stats ? pct(stats.totalPlatformFees, stats.totalVolume) : 0;
  const successPct = stats ? pct(stats.successfulPayouts, stats.totalPayouts) : 0;
  const failedPct = stats ? pct(stats.failedPayouts, stats.totalPayouts) : 0;

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-1 xl:grid-cols-8">
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">Total Volume</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="space-y-1">
                <div className="text-3xl leading-none tracking-tight">{formatCurrency(stats?.totalVolume ?? 0)}</div>
                <p className="text-muted-foreground text-xs">{stats?.totalPayouts ?? 0} payouts processed</p>
              </div>
            )}
            {!isLoading && (
              <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                {transferredPct}% transferred
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">Platform Fees</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-3xl leading-none tracking-tight">
                  {formatCurrency(stats?.totalPlatformFees ?? 0)}
                </div>
                <p className="text-muted-foreground text-xs">of {formatCurrency(stats?.totalVolume ?? 0)} volume</p>
              </div>
            )}
            {!isLoading && (
              <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                {feePct}% take rate
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">Total Payouts</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-3xl leading-none tracking-tight">{stats?.totalPayouts ?? 0}</div>
                <p className="text-muted-foreground text-xs">{stats?.successfulPayouts ?? 0} successful</p>
              </div>
            )}
            {!isLoading && (
              <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                {successPct}% success rate
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-3xl leading-none tracking-tight">{stats?.failedPayouts ?? 0}</div>
                <p className="text-muted-foreground text-xs">{stats?.pendingReview ?? 0} pending review</p>
              </div>
            )}
            {!isLoading && (
              <Badge variant="destructive" className="bg-destructive/10 text-destructive">
                {failedPct}% failed
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
