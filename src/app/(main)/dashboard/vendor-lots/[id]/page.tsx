"use client";

import { notFound, useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import type { VendorLot } from "../_components/vendor-lots-data";
import { LotReview } from "./_components/lot-review";

interface ApiLotResponse {
  data?: VendorLot;
  status?: boolean;
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-lot", id],
    queryFn: () => apiRequest<ApiLotResponse>(`/admin/lots/${id}`, token),
    enabled: sessionStatus === "authenticated",
  });

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!res?.data) return notFound();

  return <LotReview lot={res.data} />;
}
