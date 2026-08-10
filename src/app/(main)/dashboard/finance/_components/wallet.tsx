"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, CircleDollarSign, PercentSquare, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { FinanceServices, type FinanceStats } from "../_logics/services";

interface ApiStatsResponse {
  data?: FinanceStats;
}

function money(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const paymentChannels = [
  { id: 1, name: "MTN Mobile Money", note: "Primary mobile channel" },
  { id: 2, name: "Telecel Cash", note: "Secondary mobile channel" },
  { id: 3, name: "AirtelTigo Money", note: "Mobile money" },
  { id: 4, name: "Bank Transfer", note: "GCB · Ecobank · Fidelity" },
];

export function Wallet() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: () => apiRequest<ApiStatsResponse>(FinanceServices.FetchStats().endpoint, token),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  const stats = res?.data;
  const avgPayout = stats && stats.successfulPayouts > 0 ? stats.totalTransferred / stats.successfulPayouts : 0;
  const takeRate =
    stats && stats.totalVolume > 0 ? ((stats.totalPlatformFees / stats.totalVolume) * 100).toFixed(1) : "—";

  const metrics = [
    {
      id: 1,
      label: "Gross Volume",
      value: isLoading ? null : money(stats?.totalVolume ?? 0),
      icon: TrendingUp,
    },
    {
      id: 2,
      label: "Net to Vendors",
      value: isLoading ? null : money(stats?.totalTransferred ?? 0),
      icon: Banknote,
    },
    {
      id: 3,
      label: "Avg Payout",
      value: isLoading ? null : money(avgPayout),
      icon: CircleDollarSign,
    },
    {
      id: 4,
      label: "Platform Take Rate",
      value: isLoading ? null : `${takeRate}%`,
      icon: PercentSquare,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Platform Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground text-sm">{m.label}</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="font-medium text-sm tabular-nums">{m.value}</span>
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="flex flex-col gap-1">
          <p className="mb-1 text-muted-foreground text-xs">Payment Channels</p>
          {paymentChannels.map((ch) => (
            <div key={ch.id} className="flex items-center justify-between py-0.5">
              <span className="font-medium text-sm">{ch.name}</span>
              <span className="text-muted-foreground text-xs">{ch.note}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
