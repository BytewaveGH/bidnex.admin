"use client";

import { type ReactElement, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock3, Gavel, MapPin, Plus, Timer, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";

import { VendorLotServices } from "../../vendor-lots/_logics/services";
import type { IAuction } from "../_components/auction-data";
import { LotsTable } from "../_components/auction-lots";
import { AuctionServices } from "../_logics/services";

interface ApiAuctionResponse {
  data?: IAuction;
  status?: boolean;
}

interface UnassignedLot {
  id: number;
  title: string;
  condition: string;
  category: { name: string };
  vendorId: number;
}

interface UnassignedLotsResponse {
  data?: { data?: UnassignedLot[] };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const TERMINAL_STATUSES = new Set(["ended", "cancelled"]);

// ── Inject Lot Dialog ─────────────────────────────────────────────────────────

function InjectLotDialog({
  auctionId,
  auctionStatus,
  open,
  onOpenChange,
  onSuccess,
}: {
  auctionId: number;
  auctionStatus: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [search, setSearch] = useState("");
  const [injectingId, setInjectingId] = useState<number | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-lots-unassigned"],
    queryFn: () => {
      const svc = VendorLotServices.FetchUnassigned({ page: 1, limit: 100 });
      return apiRequest<UnassignedLotsResponse>(svc.endpoint, token, { params: svc.params });
    },
    enabled: open,
    staleTime: 30_000,
  });

  const lots = res?.data?.data ?? [];
  const filtered = search.trim() ? lots.filter((l) => l.title.toLowerCase().includes(search.toLowerCase())) : lots;

  async function handleInject(lotId: number) {
    setInjectingId(lotId);
    try {
      const svc = AuctionServices.InjectLot(auctionId, lotId);
      await apiRequest(svc.endpoint, token, { method: "POST" });
      const isActive = auctionStatus === "active";
      toast.success(isActive ? "Lot added and now live." : "Lot assigned — will go live when the auction starts.");
      onOpenChange(false);
      setSearch("");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add lot.");
    } finally {
      setInjectingId(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setSearch("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg gap-4">
        <DialogHeader>
          <DialogTitle>Add Lot to Auction</DialogTitle>
          <DialogDescription>Select an approved lot from the unassigned pool.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search lots…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
        <ScrollArea className="max-h-80 rounded-md border">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading…</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              {search.trim() ? "No lots match your search." : "No unassigned lots available."}
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-col py-1">
              {filtered.map((lot) => (
                <button
                  key={lot.id}
                  type="button"
                  disabled={!!injectingId}
                  onClick={() => void handleInject(lot.id)}
                  className="flex items-center justify-between gap-4 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{lot.title}</span>
                    <span className="text-muted-foreground text-xs capitalize">
                      {lot.condition.replace(/_/g, " ")} · {lot.category.name} · Vendor #{lot.vendorId}
                    </span>
                  </span>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {injectingId === lot.id ? "Adding…" : "Add"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [isCancelling, setIsCancelling] = useState(false);
  const [removingLotId, setRemovingLotId] = useState<number | null>(null);
  const [injectOpen, setInjectOpen] = useState(false);

  const svc = AuctionServices.FetchOne(Number(id));

  const { data: res, isLoading } = useQuery({
    queryKey: ["admin-auction", id],
    queryFn: () => apiRequest<ApiAuctionResponse>(svc.endpoint, token),
    enabled: sessionStatus === "authenticated",
  });

  const auction = res?.data;
  const status = auction?.status.toLowerCase() ?? "";
  const isDraft = status === "draft";
  const isActive = status === "active";
  const canCancel = !!auction && !TERMINAL_STATUSES.has(status);
  const canAddLot = isDraft || isActive;

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

  async function handleRemoveLot(lotId: number, wasActive: boolean) {
    if (!auction) return;
    setRemovingLotId(lotId);
    try {
      const s = AuctionServices.RemoveLot(auction.id, lotId);
      await apiRequest(s.endpoint, token, { method: "DELETE" });
      void queryClient.invalidateQueries({ queryKey: ["admin-auction", id] });
      void queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
      if (wasActive) {
        toast.success("Lot removed and cancelled. Bidder holds released.");
      } else {
        toast.success("Lot removed and returned to the unassigned pool.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove lot.");
    } finally {
      setRemovingLotId(null);
    }
  }

  function handleInjectSuccess() {
    void queryClient.invalidateQueries({ queryKey: ["admin-auction", id] });
    void queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-lots-unassigned"] });
  }

  // ── Derived render blocks ─────────────────────────────────────────────────

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
          {canAddLot && (
            <Button size="sm" onClick={() => setInjectOpen(true)}>
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
            onRemoveLot={handleRemoveLot}
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
      {auction && (
        <InjectLotDialog
          auctionId={auction.id}
          auctionStatus={status}
          open={injectOpen}
          onOpenChange={setInjectOpen}
          onSuccess={handleInjectSuccess}
        />
      )}
    </div>
  );
}
