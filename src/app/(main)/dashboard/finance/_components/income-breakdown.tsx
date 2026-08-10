"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { FinanceServices, type FinanceStats } from "../_logics/services";

interface ApiStatsResponse {
  data?: FinanceStats;
}

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 10) / 10;
}

export function IncomeBreakdown() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: () => apiRequest<ApiStatsResponse>(FinanceServices.FetchStats().endpoint, token),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  const stats = res?.data;
  const total = stats?.totalPayouts ?? 0;
  const successful = stats?.successfulPayouts ?? 0;
  const failed = stats?.failedPayouts ?? 0;
  const pending = stats?.pendingReview ?? 0;

  const successPct = pct(successful, total);
  const failedPct = pct(failed, total);
  const pendingPct = pct(pending, total);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Payout Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const sections = [
    {
      label: `Successful · ${successPct}%`,
      count: successful,
      barClass: "bg-emerald-500",
      widthStyle: { width: `${successPct}%` },
    },
    {
      label: `Failed · ${failedPct}%`,
      count: failed,
      barClass: "bg-destructive",
      widthStyle: { width: `${failedPct}%` },
    },
    {
      label: `Pending Review · ${pendingPct}%`,
      count: pending,
      barClass: "bg-amber-500",
      widthStyle: { width: `${pendingPct}%` },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Payout Performance</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {sections.map((s) => (
          <section key={s.label} className="isolate flex gap-[0.5px]">
            <Separator
              orientation="vertical"
              className="mb-1 h-auto self-auto border-muted-foreground/50 border-l border-dashed bg-transparent"
            />
            <div className="flex min-h-24 flex-1 flex-col justify-between">
              <div className="flex min-w-0 flex-col gap-1 px-1">
                <p className="wrap-break-word text-muted-foreground text-xs leading-none">{s.label}</p>
                <div className="text-lg tabular-nums leading-none tracking-tight">{s.count}</div>
              </div>
              <div className="-ml-0.5 h-5 rounded-sm bg-muted">
                <div className={`h-full rounded-sm transition-all ${s.barClass}`} style={s.widthStyle} />
              </div>
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
