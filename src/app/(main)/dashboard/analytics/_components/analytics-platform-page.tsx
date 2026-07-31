"use client";
"use no memo";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Monitor,
  RefreshCw,
  Smartphone,
  Swords,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import {
  type AnalyticsPlatformData,
  AnalyticsPlatformServices,
  type AnalyticsRange,
  type AnalyticsRealtimeData,
  type RealtimeBidWar,
  type RealtimeEndingSoonLot,
  type RealtimeHistoryPoint,
} from "../_logics/services";

// ── Constants ─────────────────────────────────────────────────────────────────

const RANGE_OPTIONS: { label: string; value: AnalyticsRange }[] = [
  { label: "Last 7 days", value: "last-7-days" },
  { label: "Last 4 weeks", value: "last-4-weeks" },
  { label: "Last 3 months", value: "last-3-months" },
  { label: "Year to date", value: "year-to-date" },
];

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  "last-7-days": "last 7 days",
  "last-4-weeks": "last 4 weeks",
  "last-3-months": "last 3 months",
  "year-to-date": "year to date",
};

const KPI_DEFS = [
  { key: "uniqueVisitors" as const, label: "Unique Visitors", isRate: false },
  { key: "sessions" as const, label: "Sessions", isRate: false },
  { key: "pageviews" as const, label: "Pageviews", isRate: false },
  { key: "engagementRate" as const, label: "Engagement Rate", isRate: true },
  { key: "conversionRate" as const, label: "Conversion Rate", isRate: true },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const qualityChartConfig = {
  actualQuality: { color: "var(--chart-1)", label: "Actual quality" },
  baselineQuality: { color: "var(--muted-foreground)", label: "Baseline quality" },
} satisfies ChartConfig;

const realtimeChartConfig = {
  visitors: { color: "var(--chart-3)", label: "Visitors" },
} satisfies ChartConfig;

const historyChartConfig = {
  activeBidders: { color: "var(--chart-1)", label: "Active Bidders" },
  onlineVisitors: { color: "var(--chart-3)", label: "Online Visitors" },
  bidsPerMinute: { color: "var(--chart-2)", label: "Bids / min" },
} satisfies ChartConfig;

type HistoryPeriod = "daily" | "weekly" | "monthly";

const HISTORY_PERIOD_LABELS: Record<HistoryPeriod, string> = {
  daily: "Last 24 hours",
  weekly: "Last 7 days",
  monthly: "Last 30 days",
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatValue(n: number, isRate = false): string {
  if (isRate) return `${n.toFixed(1)}%`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function formatChange(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function calcPrevious(value: number, change: number, isRate: boolean): string {
  const prev = value / (1 + change / 100);
  return formatValue(prev, isRate);
}

function formatXTick(dateStr: string, range: AnalyticsRange): string {
  const d = new Date(dateStr);
  if (range === "last-7-days") {
    const h = d.getUTCHours();
    return h === 0 ? DAYS[d.getUTCDay()] : `${h.toString().padStart(2, "0")}:00`;
  }
  if (range === "year-to-date") {
    const startOfYear = Date.UTC(d.getUTCFullYear(), 0, 1);
    const weekNo = Math.ceil((d.getTime() - startOfYear) / (7 * 24 * 3600 * 1000)) + 1;
    return `Wk ${weekNo}`;
  }
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function getChartInterval(range: AnalyticsRange): number {
  if (range === "last-7-days") return 2;
  if (range === "last-4-weeks") return 20;
  if (range === "last-3-months") return 13;
  return 3;
}

// ── Section: range tabs ────────────────────────────────────────────────────────

function RangeTabs({ range, onChange }: { range: AnalyticsRange; onChange: (r: AnalyticsRange) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium text-sm transition-colors",
            range === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatHistoryLabel(label: string, period: HistoryPeriod): string {
  const d = new Date(label);
  if (period === "daily") {
    return `${d.getUTCHours().toString().padStart(2, "0")}:00`;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatTimeLeft(bidEndTime: string): string {
  const diffMs = new Date(bidEndTime).getTime() - Date.now();
  if (diffMs <= 0) return "Ended";
  const totalSec = Math.floor(diffMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

// ── Section: ending soon row ──────────────────────────────────────────────────

function EndingSoonRow({ lot }: { lot: RealtimeEndingSoonLot }) {
  const [timeLeft, setTimeLeft] = React.useState(() => formatTimeLeft(lot.bidEndTime));

  React.useEffect(() => {
    const id = setInterval(() => setTimeLeft(formatTimeLeft(lot.bidEndTime)), 1000);
    return () => clearInterval(id);
  }, [lot.bidEndTime]);

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm">{lot.title}</span>
        <span className="font-medium text-amber-600 text-xs tabular-nums dark:text-amber-400">{timeLeft}</span>
      </div>
      <span className="shrink-0 text-muted-foreground text-xs tabular-nums">GHS {lot.currentBid.toLocaleString()}</span>
    </div>
  );
}

// ── Section: bid war row ──────────────────────────────────────────────────────

function BidWarRow({ war }: { war: RealtimeBidWar }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="min-w-0 truncate text-sm">{war.title}</span>
      <div className="flex shrink-0 items-center gap-3 text-muted-foreground text-xs tabular-nums">
        <span>GHS {war.currentBid.toLocaleString()}</span>
        <span>{war.distinctBidders} bidders</span>
        <span>{war.bidCount} bids</span>
      </div>
    </div>
  );
}

// ── Section: realtime card ─────────────────────────────────────────────────────

function RealtimeCard({ data, isError }: { data?: AnalyticsRealtimeData; isError: boolean }) {
  const onlineVisitors = data?.onlineVisitors ?? 0;
  const perMinute = data?.perMinute ?? 0;
  const minuteSeries = data?.minuteSeries ?? [];
  const activeBidders = data?.activeBidders ?? 0;
  const velocity = data?.velocity;
  const hottestLot = data?.hottestLot ?? null;
  const endingSoon = data?.endingSoon;
  const bidWars = data?.bidWars ?? [];
  const highIntentBidders = data?.highIntentBidders ?? [];
  const watchlistPressure = data?.watchlistPressure ?? [];
  const deviceSplit = data?.deviceSplit ?? null;
  const history = data?.history;
  const [historyPeriod, setHistoryPeriod] = React.useState<HistoryPeriod>("daily");
  const [intentSheetOpen, setIntentSheetOpen] = React.useState(false);
  const historyData: RealtimeHistoryPoint[] = history?.[historyPeriod] ?? [];

  const VelocityIcon = velocity?.trend === "up" ? TrendingUp : TrendingDown;
  const velocityColor = velocity?.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-normal text-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          Live now
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isError ? (
          <p className="text-muted-foreground text-xs">Realtime data unavailable.</p>
        ) : (
          <>
            {/* Top metrics row */}
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">Online now</span>
                <span className="font-semibold text-2xl tabular-nums leading-none">{onlineVisitors}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">Visitors / min</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-2xl tabular-nums leading-none">{perMinute}</span>
                  <span className="text-muted-foreground text-sm">/ min</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">Active bidders</span>
                <span className="font-semibold text-2xl tabular-nums leading-none">{activeBidders}</span>
              </div>
              {velocity && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs">Velocity (5 min)</span>
                  <div className={cn("flex items-center gap-1 font-semibold text-2xl leading-none", velocityColor)}>
                    <VelocityIcon className="size-5" />
                    <span className="tabular-nums">
                      {velocity.changePercent > 0 ? "+" : ""}
                      {velocity.changePercent.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {velocity.last5Min} vs {velocity.prior5Min} prior
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">Watchlist pressure</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-2xl tabular-nums leading-none">{watchlistPressure.length}</span>
                  <span className="text-muted-foreground text-sm">lots</span>
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {watchlistPressure.reduce((sum, item) => sum + item.watchers, 0)} watchers, no bids
                </span>
              </div>
              {deviceSplit && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs">Device split</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Smartphone className="size-4 text-muted-foreground" />
                      <span className="font-semibold text-2xl tabular-nums leading-none">
                        {deviceSplit.mobilePct.toFixed(0)}%
                      </span>
                    </div>
                    <span className="text-muted-foreground">/</span>
                    <div className="flex items-center gap-1">
                      <Monitor className="size-4 text-muted-foreground" />
                      <span className="font-semibold text-2xl tabular-nums leading-none">
                        {deviceSplit.desktopPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {deviceSplit.mobileCount} · {deviceSplit.desktopCount} users
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIntentSheetOpen(true)}
                className="flex flex-col gap-0.5 text-left transition-opacity hover:opacity-70"
              >
                <span className="text-muted-foreground text-xs">High intent</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-2xl tabular-nums leading-none">{highIntentBidders.length}</span>
                  <span className="text-muted-foreground text-sm">bidders</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {highIntentBidders.length > 0
                    ? `${highIntentBidders[0].username} · ${highIntentBidders[0].watchlistCount} lots`
                    : "none right now"}
                </span>
              </button>

              <Sheet open={intentSheetOpen} onOpenChange={setIntentSheetOpen}>
                <SheetContent className="flex flex-col gap-0 overflow-hidden p-0">
                  {/* Header */}
                  <SheetHeader className="border-b px-6 py-5">
                    <SheetTitle>High Intent Bidders</SheetTitle>
                    <SheetDescription>
                      Bidders with large watchlists but no bids yet — highest conversion opportunity right now.
                    </SheetDescription>
                  </SheetHeader>

                  {/* Summary strip */}
                  {highIntentBidders.length > 0 && (
                    <div className="flex items-center gap-6 border-b bg-muted/40 px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-lg tabular-nums leading-none">
                          {highIntentBidders.length}
                        </span>
                        <span className="mt-0.5 text-muted-foreground text-xs">bidders</span>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-lg tabular-nums leading-none">
                          {highIntentBidders.reduce((s, b) => s + b.watchlistCount, 0)}
                        </span>
                        <span className="mt-0.5 text-muted-foreground text-xs">lots watched total</span>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-lg tabular-nums leading-none">
                          {highIntentBidders[0]?.watchlistCount ?? 0}
                        </span>
                        <span className="mt-0.5 text-muted-foreground text-xs">top watcher</span>
                      </div>
                    </div>
                  )}

                  {/* List */}
                  <div className="flex-1 overflow-y-auto">
                    {highIntentBidders.length === 0 ? (
                      <p className="px-6 py-8 text-center text-muted-foreground text-sm">
                        No high intent bidders right now.
                      </p>
                    ) : (
                      (() => {
                        const max = highIntentBidders[0].watchlistCount;
                        return highIntentBidders.map((b, i) => {
                          const rankColors = [
                            "bg-amber-400/20 text-amber-600 dark:text-amber-400",
                            "bg-muted text-muted-foreground",
                            "bg-orange-400/15 text-orange-600 dark:text-orange-400",
                          ];
                          const rankColor = rankColors[i] ?? "bg-muted text-muted-foreground";
                          const barWidth = Math.round((b.watchlistCount / max) * 100);
                          return (
                            <div
                              key={b.accountId}
                              className="group flex flex-col gap-2 border-b px-6 py-4 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "flex size-6 shrink-0 items-center justify-center rounded-full font-semibold text-xs",
                                    rankColor,
                                  )}
                                >
                                  {i + 1}
                                </span>
                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                  <span className="font-medium text-sm">{b.username}</span>
                                  <span className="shrink-0 font-semibold text-sm tabular-nums">
                                    {b.watchlistCount}
                                    <span className="ml-1 font-normal text-muted-foreground text-xs">lots</span>
                                  </span>
                                </div>
                              </div>
                              <div className="ml-9 h-1 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-chart-1 transition-all"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Sparkline */}
            {minuteSeries.length > 0 ? (
              <ChartContainer config={realtimeChartConfig} className="h-12 w-full">
                <BarChart data={minuteSeries} margin={{ bottom: 0, left: 0, right: 0, top: 0 }} barCategoryGap={2}>
                  <XAxis dataKey="minute" hide />
                  <YAxis hide />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="visitors" fill="var(--color-visitors)" fillOpacity={0.7} radius={1} />
                </BarChart>
              </ChartContainer>
            ) : (
              <Skeleton className="h-12 w-full" />
            )}

            {/* Hottest lot + ending soon */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {hottestLot && (
                <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Flame className="size-3 text-orange-500" />
                    Hottest lot
                  </div>
                  <p className="truncate font-medium text-sm">{hottestLot.title}</p>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground tabular-nums">
                      GHS {hottestLot.currentBid.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{hottestLot.bidCount} bids</span>
                  </div>
                </div>
              )}

              {endingSoon && endingSoon.count > 0 && (
                <div className="flex flex-col gap-1 rounded-lg bg-muted/40 p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Timer className="size-3 text-amber-500" />
                    Ending soon · {endingSoon.count}
                  </div>
                  <div className="divide-y">
                    {endingSoon.lots.map((lot) => (
                      <EndingSoonRow key={lot.id} lot={lot} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bid wars */}
            <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Swords className="size-3 text-violet-500" />
                Bid wars · {bidWars.length}
              </div>
              {bidWars.length === 0 ? (
                <p className="text-muted-foreground text-xs">No active bid wars right now.</p>
              ) : (
                <div className="divide-y">
                  {bidWars.map((war) => (
                    <BidWarRow key={war.id} war={war} />
                  ))}
                </div>
              )}
            </div>

            {/* History chart */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">Activity history</p>
                <div className="flex rounded-md bg-muted p-0.5">
                  {(["daily", "weekly", "monthly"] as HistoryPeriod[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setHistoryPeriod(p)}
                      className={cn(
                        "rounded px-2.5 py-0.5 text-xs transition-colors capitalize",
                        historyPeriod === p
                          ? "bg-background font-medium text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {HISTORY_PERIOD_LABELS[p].split(" ").slice(1).join(" ")}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground text-xs">{HISTORY_PERIOD_LABELS[historyPeriod]}</p>
              {historyData.length === 0 ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ChartContainer className="h-48 w-full" config={historyChartConfig}>
                  <ComposedChart data={historyData} margin={{ left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id="fillActiveBidders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="fillOnlineVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="label"
                      interval="preserveStartEnd"
                      tickLine={false}
                      tickMargin={8}
                      tickFormatter={(v: string) => formatHistoryLabel(v, historyPeriod)}
                    />
                    <YAxis axisLine={false} tickLine={false} tickMargin={8} width={28} yAxisId="bidders" />
                    <YAxis
                      axisLine={false}
                      orientation="right"
                      tickLine={false}
                      tickMargin={8}
                      width={32}
                      yAxisId="rate"
                      tickFormatter={(v: number) => v.toFixed(1)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      dataKey="onlineVisitors"
                      dot={false}
                      fill="url(#fillOnlineVisitors)"
                      stroke="var(--chart-3)"
                      strokeWidth={1.5}
                      strokeOpacity={0.7}
                      type="monotone"
                      yAxisId="bidders"
                    />
                    <Area
                      dataKey="activeBidders"
                      dot={false}
                      fill="url(#fillActiveBidders)"
                      stroke="var(--chart-1)"
                      strokeWidth={1.5}
                      type="monotone"
                      yAxisId="bidders"
                    />
                    <Line
                      dataKey="bidsPerMinute"
                      dot={false}
                      stroke="var(--chart-2)"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      type="monotone"
                      yAxisId="rate"
                    />
                  </ComposedChart>
                </ChartContainer>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section: KPI cards ────────────────────────────────────────────────────────

function KpiCards({
  kpis,
  isLoading,
  range,
}: {
  kpis?: AnalyticsPlatformData["kpis"];
  isLoading: boolean;
  range: AnalyticsRange;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {KPI_DEFS.map(({ key, label, isRate }) => {
          const entry = kpis?.[key];
          const isPositive = (entry?.change ?? 0) > 0;
          const isNegative = (entry?.change ?? 0) < 0;

          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="font-normal text-sm">{label}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {isLoading || !entry ? (
                  <>
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-36" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-2xl leading-none tracking-tight">{formatValue(entry.value, isRate)}</div>
                      {entry.change !== 0 && (
                        <Badge
                          className={cn(
                            isPositive && "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300",
                            isNegative && "bg-destructive/10 text-destructive",
                          )}
                        >
                          {isPositive ? <ArrowUpRight /> : <ArrowDownRight />}
                          {formatChange(Math.abs(entry.change))}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <span>
                        from <span className="text-foreground">{calcPrevious(entry.value, entry.change, isRate)}</span>
                      </span>
                      <span>•</span>
                      <span>{RANGE_LABELS[range]}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Section: traffic quality chart ───────────────────────────────────────────

function TrafficQualityChart({
  data,
  range,
  isLoading,
}: {
  data?: AnalyticsPlatformData["trafficQuality"];
  range: AnalyticsRange;
  isLoading: boolean;
}) {
  const interval = getChartInterval(range);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Traffic Quality</CardTitle>
        <CardDescription>Actual engagement vs baseline · {RANGE_LABELS[range]}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-64 w-full" />}
        {!isLoading && !data?.length && (
          <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
            No data for this period.
          </div>
        )}
        {!isLoading && !!data?.length && (
          <ChartContainer config={qualityChartConfig} className="h-64 w-full">
            <ComposedChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 4 }}>
              <defs>
                <linearGradient id="qualityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-actualQuality)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-actualQuality)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                interval={interval}
                tickFormatter={(v: string) => formatXTick(v, range)}
                tickLine={false}
                tickMargin={12}
              />
              <YAxis
                axisLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}`}
                tickLine={false}
                tickMargin={10}
                width={36}
              />
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent className="w-44" labelFormatter={() => "Traffic quality"} />}
              />
              <Area
                dataKey="actualQuality"
                dot={false}
                activeDot={{ r: 4 }}
                fill="url(#qualityFill)"
                stroke="var(--color-actualQuality)"
                strokeWidth={2.5}
                type="linear"
              />
              <Line
                dataKey="baselineQuality"
                dot={false}
                stroke="var(--color-baselineQuality)"
                strokeDasharray="4 4"
                strokeOpacity={0.65}
                strokeWidth={1.75}
                type="linear"
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Section: vendor performance table ────────────────────────────────────────

function approvalRateClass(rate: number): string {
  if (rate >= 80) return "text-green-600 dark:text-green-400";
  if (rate >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function VendorStatusBadge({ status }: { status: "active" | "inactive" | "warning" }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="h-5 border-green-500/30 bg-green-500/10 px-1.5 text-[10px] text-green-700 dark:text-green-400"
      >
        Active
      </Badge>
    );
  }
  if (status === "warning") {
    return (
      <Badge
        variant="outline"
        className="h-5 border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-amber-700 dark:text-amber-400"
      >
        Warning
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
      Inactive
    </Badge>
  );
}

function VendorTable({
  vendors,
  isLoading,
}: {
  vendors?: AnalyticsPlatformData["vendorPerformance"];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Vendor Performance</CardTitle>
        <CardDescription>All vendors with activity in the selected period, ranked by revenue</CardDescription>
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
                <TableHead className="text-right text-xs">Lots submitted</TableHead>
                <TableHead className="text-right text-xs">Approval rate</TableHead>
                <TableHead className="text-right text-xs">Avg final price</TableHead>
                <TableHead className="text-right text-xs">Total revenue</TableHead>
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
                    {vendor.approvalRate.toFixed(1)}%
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

// ── Section: error fallback ───────────────────────────────────────────────────

function SectionError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <p className="text-muted-foreground text-sm">{message ?? "Failed to load analytics data."}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        Retry
      </Button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AnalyticsPlatformPage() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const [range, setRange] = React.useState<AnalyticsRange>("last-4-weeks");

  const platformQuery = useQuery({
    queryKey: ["admin-analytics-platform", range],
    queryFn: () => {
      const svc = AnalyticsPlatformServices.Fetch(range);
      return apiRequest<{ data?: AnalyticsPlatformData; status?: boolean }>(svc.endpoint, token, {
        params: svc.params,
      });
    },
    enabled: sessionStatus === "authenticated",
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Show realtime error only after 3 consecutive failures (retry: 2 = 3 total attempts)
  const realtimeQuery = useQuery({
    queryKey: ["admin-analytics-realtime"],
    queryFn: () => {
      const svc = AnalyticsPlatformServices.FetchRealtime();
      return apiRequest<{ data?: AnalyticsRealtimeData; status?: boolean }>(svc.endpoint, token);
    },
    enabled: sessionStatus === "authenticated",
    refetchInterval: 30_000,
    retry: 2,
  });

  const platformData = platformQuery.data?.data;
  const realtimeData = realtimeQuery.data?.data;
  const isLoading = platformQuery.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <RangeTabs range={range} onChange={setRange} />
      <RealtimeCard data={realtimeData} isError={realtimeQuery.isError} />

      {platformQuery.isError ? (
        <SectionError onRetry={() => void platformQuery.refetch()} />
      ) : (
        <>
          <KpiCards kpis={platformData?.kpis} isLoading={isLoading} range={range} />
          <TrafficQualityChart data={platformData?.trafficQuality} isLoading={isLoading} range={range} />
          <VendorTable vendors={platformData?.vendorPerformance} isLoading={isLoading} />
        </>
      )}
    </div>
  );
}
