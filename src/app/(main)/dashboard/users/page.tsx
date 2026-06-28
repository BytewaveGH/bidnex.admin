"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { Users } from "./_components/users";

// ── Stats endpoint — see docs/users-stats-api.md ─────────────────────────────

export interface IUserStats {
  total: number;
  byAccountType: {
    bidder: number;
    vendor: number;
    admin: number;
  };
  byStatus: {
    active: number;
    suspended: number;
  };
  newRegistrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  verifiedCount: number;
  verificationRate: number;
}

interface UserStatsResponse {
  data: IUserStats;
}

function useUserStats(token?: string, enabled?: boolean) {
  return useQuery({
    queryKey: ["user-stats"],
    queryFn: () => apiRequest<UserStatsResponse>("/admin/users/stats", token),
    enabled: !!enabled,
    staleTime: 60_000,
  });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, loading }: { label: string; value: number | undefined; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading || value === undefined ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <span className="text-3xl leading-none tracking-tight">{value.toLocaleString()}</span>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Page() {
  const { data: session, status } = useSession();
  const ready = status === "authenticated";

  const { data: res, isLoading } = useUserStats(session?.accessToken, ready);
  const s = res?.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Users" value={s?.total} loading={isLoading} />
        <StatCard label="Bidders" value={s?.byAccountType?.bidder} loading={isLoading} />
        <StatCard label="Vendors" value={s?.byAccountType?.vendor} loading={isLoading} />
        <StatCard label="Admins" value={s?.byAccountType?.admin} loading={isLoading} />
      </div>
      <Users />
    </div>
  );
}
