"use client";

import { useState } from "react";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAILY = [
  { label: "Mon", revenue: 8400, bids: 34 },
  { label: "Tue", revenue: 12200, bids: 51 },
  { label: "Wed", revenue: 9800, bids: 42 },
  { label: "Thu", revenue: 15600, bids: 67 },
  { label: "Fri", revenue: 11300, bids: 48 },
  { label: "Sat", revenue: 22100, bids: 93 },
  { label: "Sun", revenue: 18500, bids: 79 },
];

const WEEKLY = [
  { label: "Wk 1", revenue: 68000, bids: 284 },
  { label: "Wk 2", revenue: 91000, bids: 379 },
  { label: "Wk 3", revenue: 74000, bids: 311 },
  { label: "Wk 4", revenue: 110000, bids: 462 },
  { label: "Wk 5", revenue: 88000, bids: 368 },
  { label: "Wk 6", revenue: 95000, bids: 397 },
  { label: "Wk 7", revenue: 82000, bids: 344 },
  { label: "Wk 8", revenue: 124000, bids: 519 },
];

const MONTHLY = [
  { label: "Jan", revenue: 310000, bids: 1290 },
  { label: "Feb", revenue: 275000, bids: 1150 },
  { label: "Mar", revenue: 398000, bids: 1660 },
  { label: "Apr", revenue: 342000, bids: 1430 },
  { label: "May", revenue: 460000, bids: 1920 },
  { label: "Jun", revenue: 415000, bids: 1730 },
  { label: "Jul", revenue: 388000, bids: 1620 },
  { label: "Aug", revenue: 502000, bids: 2100 },
  { label: "Sep", revenue: 447000, bids: 1870 },
  { label: "Oct", revenue: 521000, bids: 2180 },
  { label: "Nov", revenue: 610000, bids: 2550 },
  { label: "Dec", revenue: 694000, bids: 2900 },
];

const YEARLY = [
  { label: "2021", revenue: 2100000, bids: 8800 },
  { label: "2022", revenue: 3400000, bids: 14200 },
  { label: "2023", revenue: 4800000, bids: 20100 },
  { label: "2024", revenue: 5900000, bids: 24600 },
  { label: "2025", revenue: 7200000, bids: 30100 },
];

const chartConfig = {
  revenue: { label: "Revenue (GHS)", color: "var(--chart-1)" },
  bids: { label: "Bids", color: "var(--chart-2)" },
} satisfies ChartConfig;

type Period = "daily" | "weekly" | "monthly" | "yearly";

const periodData: Record<Period, typeof DAILY> = {
  daily: DAILY,
  weekly: WEEKLY,
  monthly: MONTHLY,
  yearly: YEARLY,
};

const periodDescriptions: Record<Period, string> = {
  daily: "Last 7 days",
  weekly: "Last 8 weeks",
  monthly: "Last 12 months",
  yearly: "Last 5 years",
};

const revenueTick = (v: number) =>
  v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

export function RevenueBidsChart() {
  const [period, setPeriod] = useState<Period>("monthly");
  const data = periodData[period];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">Revenue &amp; Bids</CardTitle>
        <CardDescription>{periodDescriptions[period]}</CardDescription>
        <CardAction>
          <TabsList className="h-8">
            {(["daily", "weekly", "monthly", "yearly"] as Period[]).map((p) => (
              <TabsTrigger
                key={p}
                value={p}
                className="h-7 px-2 text-xs"
                data-state={period === p ? "active" : "inactive"}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <ComposedChart data={data} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis yAxisId="revenue" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={revenueTick} />
            <YAxis yAxisId="bids" orientation="right" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value, name) => {
                    if (name === "revenue") {
                      return [`GHS ${Number(value).toLocaleString()}`, chartConfig.revenue.label];
                    }
                    return [String(value), chartConfig.bids.label];
                  }}
                />
              }
            />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />
            <Bar yAxisId="revenue" dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="bids" dataKey="bids" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
