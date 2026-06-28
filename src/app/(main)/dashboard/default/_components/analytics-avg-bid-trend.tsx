"use client";

import { useState } from "react";

import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MONTHLY = [
  { label: "Jan", avgBid: 2840, topBid: 5200 },
  { label: "Feb", avgBid: 2650, topBid: 4800 },
  { label: "Mar", avgBid: 3100, topBid: 6200 },
  { label: "Apr", avgBid: 2980, topBid: 5800 },
  { label: "May", avgBid: 3350, topBid: 6900 },
  { label: "Jun", avgBid: 3200, topBid: 6400 },
  { label: "Jul", avgBid: 3050, topBid: 6100 },
  { label: "Aug", avgBid: 3600, topBid: 7500 },
  { label: "Sep", avgBid: 3420, topBid: 7100 },
  { label: "Oct", avgBid: 3780, topBid: 7800 },
  { label: "Nov", avgBid: 4100, topBid: 8400 },
  { label: "Dec", avgBid: 4650, topBid: 9200 },
];

const WEEKLY = [
  { label: "Wk 1", avgBid: 2900, topBid: 5400 },
  { label: "Wk 2", avgBid: 3100, topBid: 5800 },
  { label: "Wk 3", avgBid: 2800, topBid: 5200 },
  { label: "Wk 4", avgBid: 3400, topBid: 6600 },
  { label: "Wk 5", avgBid: 3200, topBid: 6200 },
  { label: "Wk 6", avgBid: 3600, topBid: 7000 },
  { label: "Wk 7", avgBid: 3300, topBid: 6800 },
  { label: "Wk 8", avgBid: 3800, topBid: 7400 },
];

const DAILY = [
  { label: "Mon", avgBid: 2400, topBid: 4800 },
  { label: "Tue", avgBid: 3100, topBid: 5400 },
  { label: "Wed", avgBid: 2800, topBid: 5100 },
  { label: "Thu", avgBid: 3500, topBid: 6200 },
  { label: "Fri", avgBid: 3200, topBid: 5900 },
  { label: "Sat", avgBid: 4200, topBid: 7800 },
  { label: "Sun", avgBid: 3800, topBid: 7100 },
];

const chartConfig = {
  avgBid: { label: "Avg. Bid", color: "var(--chart-1)" },
  topBid: { label: "Top Bid", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Period = "daily" | "weekly" | "monthly";

const PERIOD_DESCRIPTIONS: Record<Period, string> = {
  daily: "Average winning bid values for the past 7 days",
  weekly: "Average winning bid values over the past 8 weeks",
  monthly: "Average winning bid values across all months this year",
};

export function AnalyticsAvgBidTrend() {
  const [period, setPeriod] = useState<Period>("monthly");

  let data = MONTHLY;
  if (period === "daily") data = DAILY;
  else if (period === "weekly") data = WEEKLY;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avg. Winning Bid</CardTitle>
        <CardDescription>{PERIOD_DESCRIPTIONS[period]}</CardDescription>
        <CardAction>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="h-7 px-2 text-xs">
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="h-7 px-2 text-xs">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="h-7 px-2 text-xs">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <ComposedChart data={data} margin={{ left: 8, right: 8 }}>
            <defs>
              <linearGradient id="fillAvgBid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: number) => `GHS ${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
            <Area type="monotone" dataKey="avgBid" fill="url(#fillAvgBid)" stroke="var(--chart-1)" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="topBid"
              stroke="var(--chart-2)"
              strokeWidth={1.2}
              dot={false}
              strokeDasharray="4 3"
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
