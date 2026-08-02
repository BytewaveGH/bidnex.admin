"use client";

import { useQuery } from "@tanstack/react-query";
import { Ban, Banknote, CheckCircle2, Circle, Gavel, Lock, Package, ShieldCheck, Truck, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import type { TimelineEvent } from "../../_components/fulfillment-data";
import { FulfillmentServices } from "../../_logics/services";

interface ApiTimelineResponse {
  data?: TimelineEvent[];
  status?: boolean;
}

const eventIcons: Record<string, typeof Circle> = {
  AUCTION_ENDED: Gavel,
  BUYER_WON: Gavel,
  BUYER_PAID: Wallet,
  PAYMENT_HELD: Lock,
  PICKUP_REQUESTED: Package,
  COURIER_ASSIGNED: Truck,
  PICKED_UP: Truck,
  IN_TRANSIT: Truck,
  DELIVERED: CheckCircle2,
  SELLER_PAID: Banknote,
  CANCELLED: Ban,
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hours}:${minutes}`;
}

interface Props {
  orderId: number | string;
}

export function OrderTimeline({ orderId }: Props) {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const svc = FulfillmentServices.FetchTimeline(orderId);
  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-order-timeline", String(orderId)],
    queryFn: () => apiRequest<ApiTimelineResponse>(svc.endpoint, token),
    enabled: sessionStatus === "authenticated",
  });

  const events = res?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base leading-none">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Timeline
          </span>
        </CardTitle>
        <CardDescription>Full audit trail of this order for support and compliance.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : events.length ? (
          <ol className="flex flex-col gap-0">
            {events.map((event, i) => {
              const Icon = eventIcons[event.type] ?? Circle;
              const isLast = i === events.length - 1;
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: timeline events may lack stable ids
                <li key={event.id ?? i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-muted">
                      <Icon className="size-3.5 text-muted-foreground" />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className={cn("flex flex-col gap-0.5", !isLast && "pb-4")}>
                    <span className="font-medium text-sm">{event.label}</span>
                    {event.description && (
                      <span className="text-muted-foreground text-xs leading-relaxed">{event.description}</span>
                    )}
                    <span className="text-muted-foreground text-xs">{formatDateTime(event.createdAt)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-muted-foreground text-sm">No events recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
