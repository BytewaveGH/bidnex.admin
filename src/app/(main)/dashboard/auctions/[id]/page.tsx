"use client";

import { type ReactElement, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock3, Gavel, MapPin, Plus, Timer, X } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import type { IAuction } from "../_components/auction-data";
import { LotsTable } from "../_components/auction-lots";
import { AuctionServices } from "../_logics/services";

interface ApiAuctionResponse {
  data?: IAuction;
  status?: boolean;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const TERMINAL_STATUSES = new Set(["ended", "cancelled"]);

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [isCancelling, setIsCancelling] = useState(false);
  const [removingLotId, setRemovingLotId] = useState<number | null>(null);

  const svc = AuctionServices.FetchOne(Number(id));

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-auction", id],
    queryFn: () => apiRequest<ApiAuctionResponse>(svc.endpoint, token),
    enabled: sessionStatus === "authenticated",
  });

  const auction = res?.data;
  const status = auction?.status.toLowerCase() ?? "";
  const isDraft = status === "draft";
  const canCancel = !!auction && !TERMINAL_STATUSES.has(status);

  async function handleCancel() {
    if (!auction) return;
    setIsCancelling(true);
    try {
      const s = AuctionServices.CancelAuction(auction.id);
      await apiRequest(s.endpoint, token, { method: "PUT" });
      void queryClient.invalidateQueries({ queryKey: ["admin-auction", id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleRemoveLot(lotId: number) {
    if (!auction) return;
    setRemovingLotId(lotId);
    try {
      const s = AuctionServices.RemoveLot(auction.id, lotId);
      await apiRequest(s.endpoint, token, { method: "DELETE" });
      void queryClient.invalidateQueries({ queryKey: ["admin-auction", id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
    } finally {
      setRemovingLotId(null);
    }
  }

  // ── Derived render blocks (avoids nested ternaries) ───────────────────────

  let auctionHeader: ReactElement;
  if (isLoading) {
    auctionHeader = (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
    );
  } else if (auction) {
    auctionHeader = (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-medium text-2xl leading-tight tracking-tight sm:text-3xl sm:leading-none">
              {auction.title}
            </h1>
            <Badge variant="secondary" className="capitalize">
              {auction.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
            {auction.locationName && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {auction.locationName}
                {auction.locationAddress && ` — ${auction.locationAddress}`}
              </span>
            )}
            {auction.startTime && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatDateTime(auction.startTime)}
              </span>
            )}
            {auction.endTime && (
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                Ends {formatDateTime(auction.endTime)}
              </span>
            )}
            {auction.lotInterval > 0 && (
              <span className="flex items-center gap-1.5">
                <Timer className="size-3.5" />
                {auction.lotInterval} min/lot
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Gavel className="size-3.5" />
              {auction.lotCount ?? auction.lots.length} lots
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isDraft && (
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Add Lot
            </Button>
          )}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isCancelling}
                  className="text-destructive hover:text-destructive"
                >
                  <X data-icon="inline-start" />
                  {isCancelling ? "Cancelling…" : "Cancel Auction"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this auction?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{auction.title}</strong> will be cancelled and all pending bids will be voided. This cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Auction</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => void handleCancel()}
                  >
                    Yes, Cancel Auction
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    );
  } else {
    auctionHeader = <p className="text-muted-foreground text-sm">Auction not found.</p>;
  }

  let lotsSection: ReactElement | null = null;
  if (isLoading) {
    lotsSection = (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  } else if (auction) {
    if (auction.lots.length > 0) {
      lotsSection = (
        <div className="overflow-hidden rounded-xl border bg-card">
          <LotsTable
            lots={auction.lots}
            auction={auction}
            isDraft={isDraft}
            onRemoveLot={isDraft ? handleRemoveLot : undefined}
            removingLotId={removingLotId}
          />
        </div>
      );
    } else {
      lotsSection = (
        <div className="flex min-h-40 items-center justify-center rounded-xl border bg-card text-muted-foreground text-sm">
          No lots in this auction yet
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/dashboard/auctions">
            <ArrowLeft data-icon="inline-start" />
            Back to Auctions
          </Link>
        </Button>
        {auctionHeader}
      </div>
      {lotsSection}
    </div>
  );
}
