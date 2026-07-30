"use client";

import { notFound, useParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import type { FulfillmentDetail as FulfillmentDetailData } from "../_components/fulfillment-data";
import { FulfillmentServices } from "../_logics/services";
import { FulfillmentDetail } from "./_components/fulfillment-detail";

interface ApiFulfillmentResponse {
  data?: FulfillmentDetailData;
  status?: boolean;
}

export default function Page() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const svc = FulfillmentServices.FetchOne(orderId);
  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-order-fulfillment", orderId],
    queryFn: () => apiRequest<ApiFulfillmentResponse>(svc.endpoint, token),
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

  return <FulfillmentDetail order={res.data} />;
}
