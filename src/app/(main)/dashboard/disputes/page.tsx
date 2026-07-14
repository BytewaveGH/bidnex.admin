"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { Disputes } from "./_components/disputes";
import { DisputeServices } from "./_logics/services";

interface DisputesStats {
  data?: {
    total: number;
    open: number;
    underReview: number;
    resolved: number;
    closed: number;
  };
  status?: boolean;
}

export default function Page() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const svc = DisputeServices.FetchStats();
  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-disputes-stats"],
    queryFn: () => apiRequest<DisputesStats>(svc.endpoint, token),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  const stats = res?.data;

  const kpiCards = [
    { label: "Total Disputes", value: stats?.total },
    { label: "Open", value: stats?.open },
    { label: "Under Review", value: stats?.underReview },
    { label: "Resolved", value: stats?.resolved },
    { label: "Closed", value: stats?.closed },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl tracking-tight">Disputes</h2>
        <p className="text-muted-foreground text-sm">Review and manage open disputes across all auctions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardAction>
                <ArrowUpRight className="size-4" />
              </CardAction>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span className="text-3xl leading-none tracking-tight">{value ?? 0}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Disputes />
    </div>
  );
}
