"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { VendorLotsList } from "./_components/vendor-lots-list";
import { VendorLotServices } from "./_logics/services";

interface LotsStats {
  data?: {
    total: number;
    byReviewStatus: {
      draft: number;
      submitted: number;
      approved: number;
      rejected: number;
    };
    byStatus: {
      active: number;
      unsold: number;
      sold: number;
      pending: number;
    };
    newSubmissions: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
  };
  status?: boolean;
}

export default function Page() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const svc = VendorLotServices.FetchStats();
  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-lots-stats"],
    queryFn: () => apiRequest<LotsStats>(svc.endpoint, token),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  const stats = res?.data;

  const kpiCards = [
    { label: "Total Lots", value: stats?.total },
    { label: "Pending Review", value: stats?.byReviewStatus.submitted },
    { label: "Approved", value: stats?.byReviewStatus.approved },
    { label: "Rejected", value: stats?.byReviewStatus.rejected },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl tracking-tight">Vendor Lots</h2>
        <p className="text-muted-foreground text-sm">
          Review and approve lots submitted by vendors before assigning them to auctions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

      <VendorLotsList />
    </div>
  );
}
