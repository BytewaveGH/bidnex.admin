"use client";
"use no memo";

import * as React from "react";

import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Banknote,
  ChevronLeft,
  Mail,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  RotateCcw,
  Store,
  Truck,
  User,
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import {
  type Address,
  courierProviders,
  deliveryStatusMeta,
  type FulfillmentDetail as FulfillmentDetailData,
  getAdminAction,
  orderStatusMeta,
  settlementStatusMeta,
} from "../../_components/fulfillment-data";
import { FulfillmentServices } from "../../_logics/services";
import { OrderTimeline } from "./order-timeline";

function formatAddress(addr: Address | string | undefined): string {
  if (!addr) return "—";
  if (typeof addr === "string") return addr.length > 0 ? addr : "—";
  const parts = [addr.line1, addr.line2, addr.city, addr.region, addr.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hours}:${minutes}`;
}

function money(amount: number) {
  return `GHS ${amount.toFixed(2)}`;
}

interface Props {
  order: FulfillmentDetailData;
}

export function FulfillmentDetail({ order }: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [initiateOpen, setInitiateOpen] = React.useState(false);
  const [provider, setProvider] = React.useState(courierProviders[0]);
  const [deliveryFee, setDeliveryFee] = React.useState("");
  const [releaseConfirmOpen, setReleaseConfirmOpen] = React.useState(false);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const parsedDeliveryFee = deliveryFee.trim() === "" ? NaN : Number(deliveryFee);

  const [refundOpen, setRefundOpen] = React.useState(false);
  const [refundReason, setRefundReason] = React.useState("");
  const [refundPhone, setRefundPhone] = React.useState("");
  const [refundProvider, setRefundProvider] = React.useState("");
  const [refundError, setRefundError] = React.useState<string | null>(null);

  const phoneHasValue = refundPhone.trim().length > 0;
  const providerMissing = phoneHasValue && !refundProvider;
  const canRefund = !["awaiting_payment", "cancelled", "completed"].includes(order.status);

  function closeRefund() {
    setRefundOpen(false);
    setRefundReason("");
    setRefundPhone("");
    setRefundProvider("");
    setRefundError(null);
  }

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-order-fulfillment", String(order.lotId)] });

  const initiateMutation = useMutation({
    mutationFn: () => {
      const svc = FulfillmentServices.InitiateDelivery(order.lotId);
      return apiRequest(svc.endpoint, token, {
        method: svc.method,
        body: { provider, deliveryFee: parsedDeliveryFee },
      });
    },
    onSuccess: () => {
      toast.success("Pickup requested with courier.");
      setInitiateOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to initiate delivery."),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => {
      const svc = FulfillmentServices.UpdateDeliveryStatus(order.lotId);
      return apiRequest(svc.endpoint, token, { method: svc.method, body: { status } });
    },
    onSuccess: (_, status) => {
      toast.success(
        `Delivery marked as ${deliveryStatusMeta[status as keyof typeof deliveryStatusMeta]?.label ?? status}.`,
      );
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update delivery status."),
  });

  const releaseMutation = useMutation({
    mutationFn: () => {
      const svc = FulfillmentServices.ReleaseSettlement(order.lotId);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onSuccess: () => {
      toast.success("Payment released to seller.");
      setReleaseConfirmOpen(false);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to release payment."),
  });

  const retryPayoutMutation = useMutation({
    mutationFn: () => {
      const payoutId = order.settlement.payoutId ?? order.lotId;
      const svc = FulfillmentServices.RetryPayout(payoutId);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onSuccess: () => {
      toast.success("Payout retried — settlement is being processed.");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to retry payout."),
  });

  const refundMutation = useMutation({
    mutationFn: () => {
      const svc = FulfillmentServices.Refund(order.lotId);
      const body: Record<string, string> = { reason: refundReason.trim() };
      if (phoneHasValue) body.phone = refundPhone.trim();
      if (phoneHasValue && refundProvider) body.provider = refundProvider;
      return apiRequest<{ data?: { amountRefunded: number; transferredTo?: string } }>(svc.endpoint, token, {
        method: svc.method,
        body,
      });
    },
    onSuccess: (res) => {
      const d = res?.data;
      let msg = `Refund of GHS ${d?.amountRefunded ?? order.payment.amount} issued`;
      if (d?.transferredTo) msg += ` · Sent to ${d.transferredTo}`;
      toast.success(msg);
      closeRefund();
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["admin-order-timeline", String(order.lotId)] });
    },
    onError: (err) => setRefundError(err instanceof Error ? err.message : "Failed to issue refund."),
  });

  const statusMeta = orderStatusMeta[order.status];
  const deliveryMeta = order.delivery ? deliveryStatusMeta[order.delivery.status] : undefined;
  const settlementMeta = settlementStatusMeta[order.settlement.status];
  const action = getAdminAction(order);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href="/dashboard/fulfillment">
          <ChevronLeft className="size-4" />
          Fulfillment & Settlement
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl leading-tight tracking-tight">Order #{order.orderId}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5", statusMeta?.className)}>
              {statusMeta?.icon && <statusMeta.icon className="size-3.5" />}
              {statusMeta?.label ?? order.status.replace(/_/g, " ")}
            </Badge>
            <span className="text-muted-foreground text-sm">{order.lot.title}</span>
          </div>
        </div>

        {/* Primary action — always visible at the top of the page */}
        {(action || canRefund) && (
          <div className="flex shrink-0 items-center gap-2">
            {canRefund && (
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => setRefundOpen(true)}
              >
                <RotateCcw className="size-4" />
                Refund
              </Button>
            )}
            {action === "initiate-delivery" && (
              <Button onClick={() => setInitiateOpen(true)}>
                <Truck className="size-4" />
                Initiate Delivery
              </Button>
            )}
            {action === "mark-picked-up" && (
              <Button disabled={statusMutation.isPending} onClick={() => statusMutation.mutate("picked_up")}>
                <Truck className="size-4" />
                {statusMutation.isPending ? "Updating…" : "Mark Picked Up"}
              </Button>
            )}
            {action === "mark-in-transit" && (
              <Button disabled={statusMutation.isPending} onClick={() => statusMutation.mutate("in_transit")}>
                <Truck className="size-4" />
                {statusMutation.isPending ? "Updating…" : "Mark In Transit"}
              </Button>
            )}
            {action === "mark-delivered" && (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate("delivered")}
              >
                <Truck className="size-4" />
                {statusMutation.isPending ? "Updating…" : "Mark Delivered"}
              </Button>
            )}
            {action === "release-payment" && (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setReleaseConfirmOpen(true)}
              >
                Pay Vendor
              </Button>
            )}
            {action === "retry-payout" && (
              <Button
                className="bg-amber-600 text-white hover:bg-amber-700"
                disabled={retryPayoutMutation.isPending}
                onClick={() => retryPayoutMutation.mutate()}
              >
                <RefreshCw className={retryPayoutMutation.isPending ? "animate-spin" : ""} />
                {retryPayoutMutation.isPending ? "Retrying…" : "Retry Payout"}
              </Button>
            )}
            {action === "view-receipt" && (
              <Button variant="outline" onClick={() => setReceiptOpen(true)}>
                <Receipt className="size-4" />
                View Settlement Receipt
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-6">
          {/* Lot */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Lot</CardTitle>
              <CardDescription>The winning lot for this order.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {order.lot.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {order.lot.images.map((src) => (
                    // biome-ignore lint/performance/noImgElement: external vendor image URLs without configured hostname
                    <img
                      key={src}
                      src={src}
                      alt={order.lot.title}
                      className="size-20 shrink-0 rounded-md border object-cover"
                    />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-muted-foreground text-xs">Title</p>
                  <p className="font-medium text-sm">{order.lot.title}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-muted-foreground text-xs">Winning Bid</p>
                  <p className="font-medium text-sm tabular-nums">{money(order.lot.winningBid)}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-muted-foreground text-xs">Quantity</p>
                  <p className="font-medium text-sm">{order.lot.quantity ?? "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Payment</CardTitle>
              <CardDescription>Funds collected from the buyer.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Escrow Status</span>
                <Badge variant="outline" className="gap-1.5 rounded-sm border">
                  {order.payment.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Amount Paid</span>
                <span className="font-medium text-sm tabular-nums">{money(order.payment.amount)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Provider</span>
                <span className="font-medium text-sm">{order.payment.provider ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Transaction Reference</span>
                <span className="font-mono text-xs">{order.payment.transactionId ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Paid At</span>
                <span className="text-sm">{formatDateTime(order.payment.paidAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Delivery</CardTitle>
              <CardDescription>Third-party pickup and shipment tracking.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge variant="outline" className={cn("gap-1.5 rounded-sm border", deliveryMeta?.className)}>
                  {deliveryMeta?.label ?? (order.delivery ? order.delivery.status.replace(/_/g, " ") : "Pending")}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Courier</span>
                <span className="font-medium text-sm">{order.delivery?.courier ?? "—"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Tracking Number</span>
                <span className="font-mono text-xs">{order.delivery?.trackingNumber ?? "—"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Settlement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Settlement</CardTitle>
              <CardDescription>Vendor payout breakdown from the Moole escrow wallet.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge variant="outline" className={cn("gap-1.5 rounded-sm border", settlementMeta?.className)}>
                  {settlementMeta?.icon && <settlementMeta.icon className="size-3.5" />}
                  {settlementMeta?.label ?? order.settlement.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Amount to Vendor</span>
                <span className="font-medium text-sm tabular-nums">{money(order.settlement.amountToVendor)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Platform Fee</span>
                <span className="text-sm tabular-nums">{money(order.settlement.platformFee)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Delivery Fee</span>
                <span className="text-sm tabular-nums">{money(order.settlement.deliveryFee)}</span>
              </div>
              {order.settlement.transactionReference && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Transaction Reference</span>
                    <span className="font-mono text-xs">{order.settlement.transactionReference}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-6">
          {/* Buyer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base leading-none">
                <User className="size-4" />
                Buyer
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="font-medium text-sm">{order.buyer.name || `Buyer #${order.buyer.id}`}</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-muted-foreground" />
                <span className="text-sm">{order.buyer.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-muted-foreground" />
                <span className="text-sm">{order.buyer.email || "—"}</span>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="flex items-center gap-2 text-muted-foreground text-xs">
                  <MapPin className="size-3.5" />
                  Delivery Address
                </p>
                <p className="text-sm leading-relaxed">{formatAddress(order.buyer.deliveryAddress)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Seller */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base leading-none">
                <Store className="size-4" />
                Seller
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Business Name</p>
                <p className="font-medium text-sm">{order.seller.name || `Seller #${order.seller.id}`}</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-muted-foreground" />
                <span className="text-sm">{order.seller.phone || "—"}</span>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="flex items-center gap-2 text-muted-foreground text-xs">
                  <MapPin className="size-3.5" />
                  Pickup Address
                </p>
                <p className="text-sm leading-relaxed">{formatAddress(order.seller.pickupAddress)}</p>
              </div>
            </CardContent>
          </Card>

          <OrderTimeline orderId={order.lotId} />
        </div>
      </div>

      {/* Initiate delivery dialog */}
      <Dialog open={initiateOpen} onOpenChange={setInitiateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Delivery</DialogTitle>
            <DialogDescription>
              {provider === "BidChale"
                ? "BidChale will handle this delivery in-house. Coordinate pickup and drop-off directly with the seller and buyer."
                : "Request a third-party courier pickup for this lot. The seller and buyer addresses will be sent to the provider automatically."}
            </DialogDescription>
          </DialogHeader>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Courier" />
            </SelectTrigger>
            <SelectContent>
              {courierProviders.map((p) => (
                <SelectItem key={p} value={p}>
                  {p === "BidChale" ? "BidChale (Self Delivery)" : p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-2">
            <label htmlFor="delivery-fee" className="font-medium text-sm">
              Delivery Fee
            </label>
            <Input
              id="delivery-fee"
              type="number"
              min="0"
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              placeholder="Enter delivery fee"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInitiateOpen(false)} disabled={initiateMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => initiateMutation.mutate()}
              disabled={initiateMutation.isPending || Number.isNaN(parsedDeliveryFee) || parsedDeliveryFee < 0}
            >
              {initiateMutation.isPending ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Requesting…
                </>
              ) : (
                "Request Pickup"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release payment confirmation */}
      <AlertDialog open={releaseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Release payment to seller?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-3">
                <p>
                  This will transfer{" "}
                  <span className="font-medium text-foreground">{money(order.settlement.amountToVendor)}</span> from the
                  Moole escrow wallet to <span className="font-medium text-foreground">{order.seller.name}</span>, after
                  deducting a platform fee of {money(order.settlement.platformFee)} and a delivery fee of{" "}
                  {money(order.settlement.deliveryFee)}.
                </p>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-destructive text-xs leading-relaxed">
                  This action cannot be undone. Only proceed once delivery has been confirmed.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReleaseConfirmOpen(false)} disabled={releaseMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => releaseMutation.mutate()}
              disabled={releaseMutation.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {releaseMutation.isPending ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Releasing…
                </>
              ) : (
                "Confirm Release"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund dialog */}
      <Dialog
        open={refundOpen}
        onOpenChange={(open) => {
          if (!open) closeRefund();
          else setRefundOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-4 text-destructive" />
              Issue Refund
            </DialogTitle>
            <DialogDescription asChild>
              <div className="mt-1 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                <span className="font-medium text-destructive text-sm">
                  Refund {money(order.payment.amount)} to {order.buyer.name || `Buyer #${order.buyer.id}`}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="refund-reason" className="font-medium text-sm">
                Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="refund-reason"
                rows={3}
                placeholder="Why is this refund being issued?"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                disabled={refundMutation.isPending}
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="refund-phone" className="font-medium text-sm">
                Phone Number
                <span className="ml-1 font-normal text-muted-foreground text-xs">(optional)</span>
              </label>
              <Input
                id="refund-phone"
                type="tel"
                placeholder={order.buyer.phone || "Buyer's registered number"}
                value={refundPhone}
                onChange={(e) => {
                  setRefundPhone(e.target.value);
                  setRefundProvider("");
                }}
                disabled={refundMutation.isPending}
              />
              {phoneHasValue && <p className="text-muted-foreground text-xs">Overrides buyer&apos;s default number</p>}
            </div>

            {/* Provider — only when phone is filled */}
            {phoneHasValue && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="refund-provider" className="font-medium text-sm">
                  Provider <span className="text-destructive">*</span>
                </label>
                <Select value={refundProvider} onValueChange={setRefundProvider} disabled={refundMutation.isPending}>
                  <SelectTrigger
                    id="refund-provider"
                    className={cn("w-full", providerMissing && "border-destructive focus:ring-destructive")}
                  >
                    <SelectValue placeholder="Select mobile network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="TELECEL">TELECEL</SelectItem>
                    <SelectItem value="AT">AT</SelectItem>
                  </SelectContent>
                </Select>
                {providerMissing && (
                  <p className="text-destructive text-xs">Provider is required when a phone number is entered.</p>
                )}
              </div>
            )}

            {/* Inline API error */}
            {refundError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-destructive text-xs leading-relaxed">
                {refundError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRefund} disabled={refundMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={refundMutation.isPending || !refundReason.trim() || providerMissing}
              onClick={() => {
                setRefundError(null);
                refundMutation.mutate();
              }}
            >
              {refundMutation.isPending ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Processing…
                </>
              ) : (
                "Issue Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settlement receipt */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="size-4" />
              Settlement Receipt
            </DialogTitle>
            <DialogDescription>
              Order #{order.orderId} — payout to {order.seller.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Amount to Vendor</span>
              <span className="font-medium text-sm tabular-nums">{money(order.settlement.amountToVendor)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Platform Fee</span>
              <span className="text-sm tabular-nums">{money(order.settlement.platformFee)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Delivery Fee</span>
              <span className="text-sm tabular-nums">{money(order.settlement.deliveryFee)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Transaction Reference</span>
              <span className="font-mono text-xs">{order.settlement.transactionReference ?? "—"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
