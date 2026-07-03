"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronLeft, Package, Save, Truck, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import type { LotImage, LotReviewStatus, VendorLot } from "../../_components/vendor-lots-data";
import { VendorLotServices } from "../../_logics/services";

const reviewStatusMeta: Record<LotReviewStatus, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  rejected: { label: "Rejected", className: "border-destructive/30 bg-destructive/10 text-destructive" },
  draft: { label: "Draft", className: "border-muted-foreground/20 bg-muted text-muted-foreground" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function ImageGallery({ images, primaryImage }: { images: LotImage[]; primaryImage: string }) {
  const [active, setActive] = React.useState(primaryImage || images[0]?.url || "");

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
        {active ? (
          <img src={active} alt="Lot" className="size-full object-contain" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground text-sm">No image</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img) => (
            <button
              type="button"
              key={img.id}
              onClick={() => setActive(img.url)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-md border bg-muted transition-all",
                active === img.url ? "ring-2 ring-primary ring-offset-1" : "opacity-60 hover:opacity-100",
              )}
            >
              <img src={img.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditablePrice({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-medium text-muted-foreground text-sm tabular-nums">GHS</span>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-28 border-muted-foreground/40 border-b border-dashed bg-transparent text-right font-medium text-sm tabular-nums transition-colors hover:border-muted-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}

interface Props {
  lot: VendorLot;
}

export function LotReview({ lot }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  // Editable pricing fields
  // startingBid defaults to lot.reservePrice since lot.startingBid is usually 0 from the API
  const [startingBid, setStartingBid] = React.useState(lot.reservePrice ?? 0);
  const [bidIncrement, setBidIncrement] = React.useState(lot.bidIncrement ?? 0);
  const [msrp, setMsrp] = React.useState(lot.msrp ?? 0);

  const isPricingDirty =
    startingBid !== (lot.reservePrice ?? 0) || bidIncrement !== (lot.bidIncrement ?? 0) || msrp !== (lot.msrp ?? 0);

  const pricingMutation = useMutation({
    mutationFn: () => {
      const svc = VendorLotServices.UpdatePricing(lot.id);
      return apiRequest(svc.endpoint, token, {
        method: "PUT",
        body: {
          startingBid,
          reservePrice: lot.reservePrice ?? 0,
          bidIncrement,
          msrp,
          buyNowPrice: lot.buyNowPrice ?? 0,
        },
      });
    },
    onSuccess: () => {
      toast.success("Pricing saved.");
      queryClient.invalidateQueries({ queryKey: ["admin-lot", String(lot.id)] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save pricing."),
  });

  const approveMutation = useMutation({
    mutationFn: () => {
      const svc = VendorLotServices.ApproveLot(lot.id);
      return apiRequest(svc.endpoint, token, { method: "PUT" });
    },
    onSuccess: () => {
      toast.success("Lot approved.");
      router.push("/dashboard/vendor-lots");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to approve lot."),
  });

  // Reject if reserve price > 2/3 of MSRP
  const msrpThreshold = msrp > 0 ? (2 / 3) * msrp : Infinity;
  const isReserveTooHigh = msrp > 0 && lot.reservePrice > msrpThreshold;

  const meta = reviewStatusMeta[lot.reviewStatus];
  const isSubmitted = lot.reviewStatus === "submitted";

  const specEntries = Object.entries(lot.specifications ?? {});

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href="/dashboard/vendor-lots">
          <ChevronLeft className="size-4" />
          Vendor Lots
        </Link>
      </Button>

      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl leading-tight tracking-tight">{lot.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("rounded-full px-2.5", meta.className)}>
              {meta.label}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-2.5 capitalize">
              {lot.condition}
            </Badge>
            <span className="text-muted-foreground text-sm">SKU: {lot.sku}</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-6">
          {/* Image gallery */}
          <Card>
            <CardContent className="pt-6">
              <ImageGallery images={lot.images} primaryImage={lot.primaryImage} />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Description</CardTitle>
              <CardDescription>As provided by the vendor.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed">{lot.description}</p>
            </CardContent>
          </Card>

          {/* Specifications */}
          {specEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base leading-none">Specifications</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y border-t">
                  {specEntries.map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 px-6 py-3">
                      <span className="text-muted-foreground text-sm">{key}</span>
                      <span className="font-medium text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection reason (if already rejected) */}
          {lot.reviewStatus === "rejected" && lot.reviewRejectReason && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base text-destructive leading-none">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{lot.reviewRejectReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-6">
          {/* Review decision — top of right col */}
          {isSubmitted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base leading-none">Review Decision</CardTitle>
                <CardDescription>Approve or reject this lot. The vendor will be notified.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Separator />
                {isReserveTooHigh && !rejecting && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-amber-700 text-xs leading-relaxed dark:text-amber-300">
                      Reserve price exceeds 2/3 of MSRP (GHS {msrpThreshold.toFixed(2)}). This lot cannot be approved.
                    </p>
                  </div>
                )}
                {rejecting ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="rejection-reason" className="font-medium text-sm">
                        Rejection Reason
                      </label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Explain why this lot is being rejected..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-28 resize-none"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      disabled={!reason.trim()}
                      onClick={() => router.push("/dashboard/vendor-lots")}
                      className="w-full"
                    >
                      <XCircle className="size-4" />
                      Confirm Rejection
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setRejecting(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      disabled={isReserveTooHigh || approveMutation.isPending}
                      onClick={() => approveMutation.mutate()}
                    >
                      <CheckCircle2 className="size-4" />
                      {approveMutation.isPending ? "Approving…" : "Approve Lot"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => setRejecting(true)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lot details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Lot Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Vendor</p>
                <p className="font-medium text-sm">{lot.vendorName ?? `Vendor #${lot.vendorId}`}</p>
                <p className="text-muted-foreground text-xs">#{lot.vendorId}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Category</p>
                <p className="font-medium text-sm">{lot.category.name}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">SKU</p>
                <p className="font-medium text-sm">{lot.sku}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Submitted</p>
                <p className="font-medium text-sm">{formatDate(lot.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Bidding info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Bidding</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Buy Now Price — read-only */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Buy Now Price</span>
                <span className="font-medium text-sm tabular-nums">GHS {(lot.buyNowPrice ?? 0).toFixed(2)}</span>
              </div>
              <Separator />
              {/* Reserve Price — read-only */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Reserve Price</span>
                <span className="font-medium text-sm tabular-nums">GHS {(lot.reservePrice ?? 0).toFixed(2)}</span>
              </div>
              <Separator />
              {/* MSRP — editable */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">MSRP</span>
                <EditablePrice value={msrp} onChange={setMsrp} />
              </div>
              <Separator />
              {/* Starting Bid — editable, defaults to reserve price */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Starting Bid</span>
                <EditablePrice value={startingBid} onChange={setStartingBid} />
              </div>
              <Separator />
              {/* Bid Increment — editable */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Bid Increment</span>
                <EditablePrice value={bidIncrement} onChange={setBidIncrement} />
              </div>
              {isPricingDirty && (
                <>
                  <Separator />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={pricingMutation.isPending}
                    onClick={() => pricingMutation.mutate()}
                  >
                    <Save className="size-3.5" />
                    {pricingMutation.isPending ? "Saving…" : "Save Pricing"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Availability</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Package
                  className={cn("size-4", lot.pickupAvailable ? "text-emerald-600" : "text-muted-foreground/40")}
                />
                <span
                  className={cn("text-sm", lot.pickupAvailable ? "font-medium" : "text-muted-foreground line-through")}
                >
                  Pickup available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Truck
                  className={cn("size-4", lot.shippingAvailable ? "text-emerald-600" : "text-muted-foreground/40")}
                />
                <span
                  className={cn(
                    "text-sm",
                    lot.shippingAvailable ? "font-medium" : "text-muted-foreground line-through",
                  )}
                >
                  Shipping available
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
