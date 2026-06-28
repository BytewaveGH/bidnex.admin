"use client";

import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const data = [
  { name: "Watches", value: 187500, fill: "var(--chart-1)" },
  { name: "Electronics", value: 142300, fill: "var(--chart-2)" },
  { name: "Jewellery", value: 98700, fill: "var(--chart-3)" },
  { name: "Home/Kitchen", value: 54100, fill: "var(--chart-4)" },
  { name: "Photography", value: 38600, fill: "var(--chart-5)" },
  { name: "Other", value: 28400, fill: "var(--muted-foreground)" },
];

const total = data.reduce((sum, d) => sum + d.value, 0);

const chartConfig = {
  value: { label: "Revenue" },
  Watches: { label: "Watches", color: "var(--chart-1)" },
  Electronics: { label: "Electronics", color: "var(--chart-2)" },
  Jewellery: { label: "Jewellery", color: "var(--chart-3)" },
  "Home/Kitchen": { label: "Home/Kitchen", color: "var(--chart-4)" },
  Photography: { label: "Photography", color: "var(--chart-5)" },
  Other: { label: "Other", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

export function AnalyticsRevenueByCategory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Category</CardTitle>
        <CardDescription>GHS share of total settled revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ChartContainer className="aspect-square h-48" config={chartConfig}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
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
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: entry.fill }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-medium tabular-nums">{((entry.value / total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
