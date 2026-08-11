"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { FinanceServices, type FinanceStats } from "../_logics/services";

interface ApiStatsResponse {
  data?: FinanceStats;
}

export function FinanceNotification() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: () => apiRequest<ApiStatsResponse>(FinanceServices.FetchStats().endpoint, token),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-16 w-full rounded-xl" />;

  const stats = res?.data;
  const failed = stats?.failedPayouts ?? 0;
  const pending = stats?.pendingReview ?? 0;

  if (failed > 0) {
    return (
      <Item className="rounded-xl border-destructive/30 bg-destructive/5" variant="outline">
        <ItemMedia variant="icon">
          <AlertTriangle className="text-destructive" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-destructive">
            {failed} payout{failed !== 1 ? "s" : ""} failed
          </ItemTitle>
          <ItemDescription>Retry failed transfers to complete vendor settlements.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="destructive">
            Review
          </Button>
        </ItemActions>
      </Item>
    );
  }

  if (pending > 0) {
    return (
      <Item className="rounded-xl border-amber-500/30 bg-amber-500/5" variant="outline">
        <ItemMedia variant="icon">
          <Clock className="text-amber-600 dark:text-amber-400" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-amber-700 dark:text-amber-300">
            {pending} payout{pending !== 1 ? "s" : ""} pending review
          </ItemTitle>
          <ItemDescription>These payouts are awaiting manual approval before release.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            Review
          </Button>
        </ItemActions>
      </Item>
    );
  }

  return (
    <Item className="rounded-xl border-emerald-500/30 bg-emerald-500/5" variant="outline">
      <ItemMedia variant="icon">
        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-emerald-700 dark:text-emerald-300">All payouts healthy</ItemTitle>
        <ItemDescription>No failed or pending-review payouts at this time.</ItemDescription>
      </ItemContent>
    </Item>
  );
}
