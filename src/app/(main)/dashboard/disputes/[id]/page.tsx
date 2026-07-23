"use client";

import { notFound, useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import type { DisputeDetail } from "../_components/dispute-data";
import { DisputeServices } from "../_logics/services";
import { DisputeReview } from "./_components/dispute-review";

interface ApiDisputeResponse {
  data?: DisputeDetail;
  status?: boolean;
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const svc = DisputeServices.FetchOne(id);
  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-dispute", id],
    queryFn: () => apiRequest<ApiDisputeResponse>(svc.endpoint, token),
    enabled: sessionStatus === "authenticated",
  });

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!res?.data) return notFound();

  return <DisputeReview dispute={res.data} />;
}
