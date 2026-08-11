"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { FinanceServices, type FinanceStats } from "../_logics/services";

interface ApiStatsResponse {
  data?: FinanceStats;
}

const chartConfig = {
  amount: { label: "Amount" },
  transferred: { color: "var(--chart-2)", label: "Paid to Vendors" },
  fees: { color: "var(--chart-1)", label: "Platform Revenue" },
  escrow: { color: "var(--chart-3)", label: "Held in Escrow" },
} satisfies ChartConfig;

function money(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(part: number, whole: number) {
  if (!whole) return "0";
  return (Math.round((part / whole) * 1000) / 10).toFixed(1);
}

export function BalanceDistributionCard() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: () => apiRequest<ApiStatsResponse>(FinanceServices.FetchStats().endpoint, token),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Funds Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  const stats = res?.data;
  const totalVolume = stats?.totalVolume ?? 0;
  const transferred = stats?.totalTransferred ?? 0;
  const fees = stats?.totalPlatformFees ?? 0;
  const escrow = Math.max(0, totalVolume - transferred - fees);

  const segments = [
    { key: "transferred", label: "Paid to Vendors", amount: transferred, fill: "var(--chart-2)" },
    { key: "fees", label: "Platform Revenue", amount: fees, fill: "var(--chart-1)" },
    { key: "escrow", label: "Held in Escrow", amount: escrow, fill: "var(--chart-3)" },
  ];

  const chartData = segments.map((s) => ({ ...s }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Funds Distribution</CardTitle>
      </CardHeader>
      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-50">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="w-52" nameKey="label" />} />
            <Pie
              cornerRadius={6}
              data={chartData}
              dataKey="amount"
              innerRadius={65}
              nameKey="label"
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) return null;
                  return (
                    <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                      <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy ?? 0) - 8}>
                        GMV
                      </tspan>
                      <tspan
                        className="fill-foreground font-medium text-base tabular-nums"
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                      >
                        {money(totalVolume)}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex min-w-0 flex-col gap-3">
          {segments.map((s) => (
            <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={s.key}>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1">
                  <span aria-hidden="true" className="h-2 w-1 rounded-full" style={{ backgroundColor: s.fill }} />
                  <p className="truncate text-muted-foreground text-xs">{s.label}</p>
                </div>
                <p className="font-medium text-sm tabular-nums">{money(s.amount)}</p>
              </div>
              <div className="font-medium text-sm tabular-nums">{pct(s.amount, totalVolume)}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
