"use client";

import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { FinanceServices, type Payout } from "../_logics/services";

interface ApiPayoutsResponse {
  data?: { count?: number; data?: Payout[] };
}

function money(n: number) {
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function UpcomingTransactions() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-finance-payouts-recent"],
    queryFn: () => {
      const svc = FinanceServices.FetchPayouts({ status: "completed", page: 1, limit: 5 });
      return apiRequest<ApiPayoutsResponse>(svc.endpoint, token, { params: svc.params });
    },
    enabled: sessionStatus === "authenticated",
    staleTime: 60_000,
  });

  const lots = res?.data?.data ?? [];
  const total = lots.reduce((sum, p) => sum + p.transferAmount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Recent Sold Lots</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}
        {!isLoading && lots.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Package className="size-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No completed lots yet.</p>
          </div>
        )}
        {!isLoading && lots.length > 0 && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="flex items-baseline text-3xl leading-none tracking-tight">
                <span className="font-normal">{money(total)}</span>
              </h2>
              <p className="text-muted-foreground text-sm leading-none">
                Last <span className="font-medium text-foreground">{lots.length}</span> completed payouts
              </p>
            </div>

            <ItemGroup>
              {lots.map((payout) => (
                <Item key={payout.id} variant="outline" size="xs">
                  <ItemMedia>
                    <div className="grid size-9 place-items-center rounded-md border bg-background">
                      <Package className="size-4 text-muted-foreground" />
                    </div>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="truncate">{payout.lotTitle}</ItemTitle>
                    <ItemDescription>
                      {payout.vendorName} · {fmtDate(payout.createdAt)}
                    </ItemDescription>
                  </ItemContent>
                  <div className="shrink-0 text-right">
                    <p className="font-medium text-sm tabular-nums">{money(payout.transferAmount)}</p>
                  </div>
                </Item>
              ))}
            </ItemGroup>
          </>
        )}
      </CardContent>
    </Card>
  );
}
