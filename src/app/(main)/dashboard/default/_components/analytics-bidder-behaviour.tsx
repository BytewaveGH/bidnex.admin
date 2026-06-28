"use client";

import { useState } from "react";

import { Bar, CartesianGrid, ComposedChart, XAxis } from "recharts";

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

const MONTHLY = [
  { label: "Jan", newBidders: 312, returning: 480 },
  { label: "Feb", newBidders: 287, returning: 440 },
  { label: "Mar", newBidders: 421, returning: 530 },
  { label: "Apr", newBidders: 398, returning: 510 },
  { label: "May", newBidders: 465, returning: 620 },
  { label: "Jun", newBidders: 440, returning: 590 },
  { label: "Jul", newBidders: 388, returning: 548 },
  { label: "Aug", newBidders: 512, returning: 680 },
  { label: "Sep", newBidders: 478, returning: 640 },
  { label: "Oct", newBidders: 534, returning: 710 },
  { label: "Nov", newBidders: 601, returning: 790 },
  { label: "Dec", newBidders: 694, returning: 880 },
];

const WEEKLY = [
  { label: "Wk 1", newBidders: 78, returning: 124 },
  { label: "Wk 2", newBidders: 95, returning: 148 },
  { label: "Wk 3", newBidders: 82, returning: 131 },
  { label: "Wk 4", newBidders: 112, returning: 167 },
  { label: "Wk 5", newBidders: 98, returning: 152 },
  { label: "Wk 6", newBidders: 124, returning: 188 },
  { label: "Wk 7", newBidders: 108, returning: 171 },
  { label: "Wk 8", newBidders: 137, returning: 204 },
];

const chartConfig = {
  newBidders: { label: "New Bidders", color: "var(--chart-1)" },
  returning: { label: "Returning", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function AnalyticsBidderBehaviour() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");

  const data = period === "monthly" ? MONTHLY : WEEKLY;
  const description =
    period === "monthly" ? "Monthly new vs returning — last 12 months" : "Weekly new vs returning — last 8 weeks";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bidder Activity</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Select value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}>
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
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <ComposedChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="newBidders" fill="var(--chart-1)" barSize={16} radius={[3, 3, 0, 0]} />
            <Bar dataKey="returning" fill="var(--chart-2)" barSize={16} radius={[3, 3, 0, 0]} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
