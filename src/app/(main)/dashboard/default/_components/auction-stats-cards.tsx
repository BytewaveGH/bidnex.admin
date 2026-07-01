"use client";

import { useQuery } from "@tanstack/react-query";
import { Gavel, Package, Target, Zap } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api-client";

interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  totalLots: number;
  liveBids: number;
}

interface AuctionStatsResponse {
  data: AuctionStats;
  status: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{value ?? "—"}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

export function AuctionStatsCards() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data } = useQuery({
    queryKey: ["auction-stats"],
    queryFn: () => apiRequest<AuctionStatsResponse>("/admin/auctions/stats", token),
    enabled: sessionStatus === "authenticated",
    staleTime: 60_000,
  });

  const stats = data?.data;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <StatCard
        icon={Gavel}
        label="Total Auctions"
        value={stats?.totalAuctions}
        description="All auctions on the platform"
      />
      <StatCard icon={Zap} label="Active Auctions" value={stats?.activeAuctions} description="Currently running" />
      <StatCard icon={Package} label="Total Lots" value={stats?.totalLots} description="Lots across all auctions" />
      <StatCard icon={Target} label="Live Bids" value={stats?.liveBids} description="Bids placed right now" />
    </div>
  );
}
