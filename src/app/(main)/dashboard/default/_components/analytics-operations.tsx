"use client";
"use no memo";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { MousePointerClick, RefreshCw, TrendingUp, UserCheck, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { AnalyticsServices } from "../_logics/services";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EarningsSummary {
  grossRevenue: number;
  grossRevenueChange: number;
  pendingReconciliation: number;
  pendingReconciliationLotCount: number;
  platformFee: number;
  platformFeeRate: number;
  vendorPayouts: number;
  vendorPayoutsChange: number;
}

interface EarningsBreakdownItem {
  category: string;
  fees: number;
  pct: number;
}

interface RevenueCategoryItem {
  name: string;
  value: number;
}

interface BidTrendPoint {
  avgBid: number;
  label: string;
  topBid: number;
}

interface BidderActivityPoint {
  label: string;
  newBidders: number;
  returning: number;
}

interface FunnelStage {
  count: number;
  label: string;
  stepPct: number;
}

interface VendorRow {
  approvalRate: number;
  avgFinalPrice: number;
  id: number;
  name: string;
  status: "active" | "inactive" | "warning";
  submitted: number;
  totalRevenue: number;
}

interface UserStatsData {
  activeBiddersThisMonth: number;
  avgBidsPerActiveUser: number;
  avgBidsPerActiveUserChange: number;
  avgBidsPerActiveUserPrev: number;
  newRegistrationsChange: number;
  newRegistrationsPrevMonth: number;
  newRegistrationsThisMonth: number;
  totalRegisteredBidders: number;
}

interface OperationsData {
  avgBidTrend: { daily: BidTrendPoint[]; monthly: BidTrendPoint[]; weekly: BidTrendPoint[] };
  bidderActivity: { monthly: BidderActivityPoint[]; weekly: BidderActivityPoint[] };
  conversionFunnel: { overallPct: number; stages: FunnelStage[] };
  earnings: { breakdown: EarningsBreakdownItem[]; summary: EarningsSummary };
  revenueByCategory: RevenueCategoryItem[];
  userStats: UserStatsData;
  vendorPerformance: VendorRow[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const FUNNEL_OPACITIES = [1, 0.88, 0.76, 0.64, 0.52, 0.4, 0.3];

const avgBidChartConfig = {
  avgBid: { color: "var(--chart-1)", label: "Avg. Bid" },
  topBid: { color: "var(--chart-2)", label: "Top Bid" },
} satisfies ChartConfig;

const bidderChartConfig = {
  newBidders: { color: "var(--chart-1)", label: "New Bidders" },
  returning: { color: "var(--chart-2)", label: "Returning" },
} satisfies ChartConfig;

const BID_PERIOD_LABELS = {
  daily: "Average winning bid values for the past 7 days",
  monthly: "Average winning bid values across all months this year",
  weekly: "Average winning bid values over the past 8 weeks",
} as const;

const USER_STAT_ICONS = [Users, UserCheck, TrendingUp, MousePointerClick] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtGHS(n: number): string {
  return `GHS ${n.toLocaleString()}`;
}

function fmtChange(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function approvalRateClass(rate: number): string {
  if (rate >= 80) return "text-green-600 dark:text-green-400";
  if (rate >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="shrink-0 font-semibold text-sm">{children}</h2>
      <Separator className="flex-1" />
    </div>
  );
}

// ── Section: platform earnings ────────────────────────────────────────────────

function EarningsSection({
  breakdown,
  isLoading,
  summary,
}: {
  breakdown?: EarningsBreakdownItem[];
  isLoading: boolean;
  summary?: EarningsSummary;
}) {
  const tiles = summary
    ? [
        {
          change: fmtChange(summary.grossRevenueChange),
          label: "Gross Revenue",
          up: summary.grossRevenueChange > 0,
          value: fmtGHS(summary.grossRevenue),
        },
        {
          change: fmtChange(summary.grossRevenueChange),
          label: `Platform Fee (${summary.platformFeeRate}%)`,
          up: summary.grossRevenueChange > 0,
          value: fmtGHS(summary.platformFee),
        },
        {
          change: fmtChange(summary.vendorPayoutsChange),
          label: "Vendor Payouts",
          up: summary.vendorPayoutsChange > 0,
          value: fmtGHS(summary.vendorPayouts),
        },
        {
          change: `${summary.pendingReconciliationLotCount} lots`,
          label: "Pending Reconciliation",
          up: false,
          value: fmtGHS(summary.pendingReconciliation),
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Earnings</CardTitle>
        <CardDescription>Revenue and fees — current month</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))
            : tiles.map((tile) => (
                <div key={tile.label} className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3">
                  <p className="text-muted-foreground text-xs">{tile.label}</p>
                  <p className="font-semibold text-xl tabular-nums">{tile.value}</p>
                  <p
                    className={cn(
                      "text-xs",
                      tile.up ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {tile.change}
                  </p>
                </div>
              ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm">Fee breakdown by category</p>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
                <Skeleton key={i} className="h-4 w-full" />
              ))
            : (breakdown ?? []).map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-muted-foreground text-xs">{item.category}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="w-16 text-right font-medium text-xs tabular-nums">
                    GHS {item.fees.toLocaleString()}
                  </span>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Section: revenue by category ──────────────────────────────────────────────

function RevenueByCategorySection({ data, isLoading }: { data?: RevenueCategoryItem[]; isLoading: boolean }) {
  const categories = data ?? [];
  const total = categories.reduce((sum, d) => sum + d.value, 0);

  const pieConfig: ChartConfig = { value: { label: "Revenue" } };
  for (const [i, cat] of categories.entries()) {
    pieConfig[cat.name] = { color: CHART_COLORS[i] ?? "var(--muted-foreground)", label: cat.name };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Category</CardTitle>
        <CardDescription>GHS share of total settled revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-4">
            <Skeleton className="aspect-square h-48 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        )}
        {!isLoading && !categories.length && (
          <p className="py-10 text-center text-muted-foreground text-sm">No revenue data for this period.</p>
        )}
        {!isLoading && !!categories.length && (
          <div className="flex items-center gap-4">
            <ChartContainer className="aspect-square h-48" config={pieConfig}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  innerRadius={55}
                  nameKey="name"
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {categories.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i] ?? "var(--muted-foreground)"} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent hideLabel formatter={(value) => `GHS ${Number(value).toLocaleString()}`} />
                  }
                />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-1 flex-col justify-center gap-2">
              {categories.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: CHART_COLORS[i] ?? "var(--muted-foreground)" }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="font-medium tabular-nums">
                    {total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section: avg winning bid trend ────────────────────────────────────────────

type BidPeriod = "daily" | "monthly" | "weekly";

function AvgBidTrendSection({ data, isLoading }: { data?: OperationsData["avgBidTrend"]; isLoading: boolean }) {
  const [period, setPeriod] = React.useState<BidPeriod>("daily");
  const chartData = data?.[period] ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avg. Winning Bid</CardTitle>
        <CardDescription>{BID_PERIOD_LABELS[period]}</CardDescription>
        <CardAction>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as BidPeriod)}>
            <TabsList className="h-8">
              <TabsTrigger className="h-7 px-2 text-xs" value="daily">
                Daily
              </TabsTrigger>
              <TabsTrigger className="h-7 px-2 text-xs" value="weekly">
                Weekly
              </TabsTrigger>
              <TabsTrigger className="h-7 px-2 text-xs" value="monthly">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <Skeleton className="mx-6 h-64" />}
        {!isLoading && !chartData.length && (
          <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
            No data for this period.
          </div>
        )}
        {!isLoading && !!chartData.length && (
          <ChartContainer className="aspect-auto h-64 w-full" config={avgBidChartConfig}>
            <ComposedChart data={chartData} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="fillAvgBidOps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={68}
                tickFormatter={(v: number) => `GHS ${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
              <Area
                dataKey="avgBid"
                fill="url(#fillAvgBidOps)"
                stroke="var(--chart-1)"
                strokeWidth={1.5}
                type="monotone"
              />
              <Line
                dataKey="topBid"
                dot={false}
                stroke="var(--chart-2)"
                strokeDasharray="4 3"
                strokeWidth={1.2}
                type="monotone"
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section: bidder activity ───────────────────────────────────────────────────

function BidderActivitySection({ data, isLoading }: { data?: OperationsData["bidderActivity"]; isLoading: boolean }) {
  const [period, setPeriod] = React.useState<"monthly" | "weekly">("weekly");
  const chartData = data?.[period] ?? [];
  const description =
    period === "monthly" ? "Monthly new vs returning — last 12 months" : "Weekly new vs returning — last 8 weeks";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bidder Activity</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Select value={period} onValueChange={(v) => setPeriod(v as "monthly" | "weekly")}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && <Skeleton className="mx-6 h-64" />}
        {!isLoading && !chartData.length && (
          <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
            No data for this period.
          </div>
        )}
        {!isLoading && !!chartData.length && (
          <ChartContainer className="aspect-auto h-64 w-full" config={bidderChartConfig}>
            <ComposedChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar barSize={16} dataKey="newBidders" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Bar barSize={16} dataKey="returning" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section: conversion funnel ────────────────────────────────────────────────

function ConversionFunnelSection({
  data,
  isLoading,
}: {
  data?: OperationsData["conversionFunnel"];
  isLoading: boolean;
}) {
  const stages = data?.stages ?? [];
  const firstCount = stages[0]?.count ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auction Conversion Funnel</CardTitle>
        <CardDescription>End-to-end lot journey</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))
          : stages.map((stage, i) => {
              const barWidth = Math.round((stage.count / firstCount) * 100);
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-muted-foreground text-xs">{stage.label}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ opacity: FUNNEL_OPACITIES[i] ?? 0.3, width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-medium text-xs tabular-nums">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="w-10 text-right text-muted-foreground text-xs tabular-nums">
                    {i > 0 ? `${stage.stepPct}%` : ""}
                  </span>
                </div>
              );
            })}
        {!isLoading && (data?.overallPct ?? 0) > 0 && (
          <p className="pt-1 text-center text-muted-foreground text-xs">
            Overall conversion: <span className="font-medium text-foreground">{data?.overallPct.toFixed(1)}%</span>{" "}
            (Lots Listed → Settled)
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section: vendor performance ───────────────────────────────────────────────

function VendorStatusBadge({ status }: { status: "active" | "inactive" | "warning" }) {
  if (status === "active") {
    return (
      <span className="inline-flex h-5 items-center rounded-md border border-green-500/30 bg-green-500/10 px-1.5 text-[10px] text-green-700 dark:text-green-400">
        Active
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span className="inline-flex h-5 items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-amber-700 dark:text-amber-400">
        Warning
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 items-center rounded-md border px-1.5 text-[10px] text-muted-foreground">
      Inactive
    </span>
  );
}

function VendorPerformanceSection({ isLoading, vendors }: { isLoading: boolean; vendors?: VendorRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Performance</CardTitle>
        <CardDescription>All vendors — current period</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading && (
          <div className="flex flex-col gap-3 px-6">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        )}
        {!isLoading && !vendors?.length && (
          <p className="py-10 text-center text-muted-foreground text-sm">No vendor activity for this period.</p>
        )}
        {!isLoading && !!vendors?.length && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 text-xs">Vendor</TableHead>
                <TableHead className="text-right text-xs">Lots Submitted</TableHead>
                <TableHead className="text-right text-xs">Approval Rate</TableHead>
                <TableHead className="text-right text-xs">Avg Final Price</TableHead>
                <TableHead className="text-right text-xs">Total Revenue</TableHead>
                <TableHead className="pr-6 text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="pl-6 font-medium text-sm">{vendor.name}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{vendor.submitted}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium text-sm tabular-nums",
                      approvalRateClass(vendor.approvalRate),
                    )}
                  >
                    {vendor.approvalRate}%
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    GHS {vendor.avgFinalPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm tabular-nums">
                    GHS {vendor.totalRevenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="pr-6">
                    <VendorStatusBadge status={vendor.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section: user analytics ───────────────────────────────────────────────────

function UserStatsSection({ isLoading, stats }: { isLoading: boolean; stats?: UserStatsData }) {
  const tiles = stats
    ? [
        {
          badge: `+${stats.newRegistrationsThisMonth.toLocaleString()} this month`,
          label: "Registered Bidders",
          sub: "Total verified accounts",
          value: stats.totalRegisteredBidders.toLocaleString(),
        },
        {
          badge:
            stats.totalRegisteredBidders > 0
              ? `${((stats.activeBiddersThisMonth / stats.totalRegisteredBidders) * 100).toFixed(1)}% of total`
              : "—",
          label: "Active This Month",
          sub: "Placed at least one bid",
          value: stats.activeBiddersThisMonth.toLocaleString(),
        },
        {
          badge: fmtChange(stats.newRegistrationsChange),
          label: "New Registrations",
          sub: `vs. last month's ${stats.newRegistrationsPrevMonth.toLocaleString()}`,
          value: stats.newRegistrationsThisMonth.toLocaleString(),
        },
        {
          badge:
            stats.avgBidsPerActiveUserChange >= 0
              ? `+${stats.avgBidsPerActiveUserChange.toFixed(1)}`
              : `${stats.avgBidsPerActiveUserChange.toFixed(1)}`,
          label: "Avg Bids / Active User",
          sub: `vs. last month's ${stats.avgBidsPerActiveUserPrev.toFixed(1)}`,
          value: stats.avgBidsPerActiveUser.toFixed(1),
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        : tiles.map((tile, i) => {
            const Icon = USER_STAT_ICONS[i] ?? Users;
            return (
              <Card key={tile.label}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-normal text-sm">
                    {tile.label}
                    <Icon className="size-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <p className="font-semibold text-2xl tabular-nums">{tile.value}</p>
                  <p className="text-muted-foreground text-xs">{tile.badge}</p>
                  <p className="text-muted-foreground text-xs">{tile.sub}</p>
                </CardContent>
              </Card>
            );
          })}
    </div>
  );
}

// ── Error fallback ────────────────────────────────────────────────────────────

function AnalyticsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <p className="text-muted-foreground text-sm">Failed to load analytics data.</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        Retry
      </Button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AnalyticsOperations() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const {
    data: raw,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-analytics-operations"],
    queryFn: () => {
      const svc = AnalyticsServices.FetchOperations();
      return apiRequest<{ data?: OperationsData; status?: boolean }>(svc.endpoint, token);
    },
    enabled: sessionStatus === "authenticated",
    staleTime: 2 * 60 * 1000,
  });

  if (isError) return <AnalyticsError onRetry={() => void refetch()} />;

  const data = raw?.data;

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeading>Revenue &amp; Earnings</SectionHeading>
        <EarningsSection breakdown={data?.earnings.breakdown} isLoading={isLoading} summary={data?.earnings.summary} />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <RevenueByCategorySection data={data?.revenueByCategory} isLoading={isLoading} />
          <AvgBidTrendSection data={data?.avgBidTrend} isLoading={isLoading} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>Auction Performance</SectionHeading>
        <ConversionFunnelSection data={data?.conversionFunnel} isLoading={isLoading} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>Bidder Analytics</SectionHeading>
        <BidderActivitySection data={data?.bidderActivity} isLoading={isLoading} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>Vendor Analytics</SectionHeading>
        <VendorPerformanceSection isLoading={isLoading} vendors={data?.vendorPerformance} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading>User Analytics</SectionHeading>
        <UserStatsSection isLoading={isLoading} stats={data?.userStats} />
      </section>
    </>
  );
}
