import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Lock,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  Unlock,
  XCircle,
} from "lucide-react";

export type OrderStatus =
  | "awaiting_payment"
  | "payment_received"
  | "ready_for_pickup"
  | "courier_assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | "returned";

export type DeliveryStatus =
  | "pending"
  | "courier_assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed"
  | "returned";

export type SettlementStatus = "held" | "ready_to_release" | "released" | "failed" | "refunded";

export type PaymentStatus = "pending" | "received" | "held" | "refunded" | "failed";

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface FulfillmentOrderSummary {
  orderId: number;
  lotId: number;
  lotTitle: string;
  buyerName: string;
  amount: number;
  status: OrderStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface FulfillmentBuyer {
  id: number;
  name: string;
  phone: string;
  email: string;
  deliveryAddress: Address | string;
}

export interface FulfillmentSeller {
  id: number;
  name: string;
  phone: string;
  pickupAddress?: Address | string;
}

export interface FulfillmentLot {
  id: number;
  title: string;
  images: string[];
  winningBid: number;
  quantity?: number;
}

export interface FulfillmentPayment {
  status: PaymentStatus | string;
  amount: number;
  transactionId?: string | null;
  provider?: string | null;
  paidAt: string | null;
}

export interface FulfillmentDelivery {
  status: DeliveryStatus;
  courier: string | null;
  trackingNumber: string | null;
}

export interface FulfillmentSettlement {
  status: SettlementStatus;
  amountToVendor: number;
  platformFee: number;
  deliveryFee: number;
  transactionReference?: string | null;
  releasedAt?: string | null;
  payoutId?: number | string | null;
}

export interface FulfillmentDetail {
  orderId: number;
  lotId: number;
  status: OrderStatus;
  buyer: FulfillmentBuyer;
  seller: FulfillmentSeller;
  lot: FulfillmentLot;
  payment: FulfillmentPayment;
  delivery: FulfillmentDelivery | null;
  settlement: FulfillmentSettlement;
}

export interface TimelineEvent {
  id: number | string;
  type: string;
  label: string;
  description?: string;
  createdAt: string;
}

export const orderStatusMeta: Record<OrderStatus, { label: string; className: string; icon: typeof Clock }> = {
  awaiting_payment: {
    label: "Awaiting Payment",
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
    icon: Clock,
  },
  payment_received: {
    label: "Payment Received",
    className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    icon: ShieldCheck,
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: Package,
  },
  courier_assigned: {
    label: "Courier Assigned",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: Truck,
  },
  picked_up: {
    label: "Picked Up",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: Truck,
  },
  in_transit: {
    label: "In Transit",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  completed: {
    label: "Completed",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  returned: {
    label: "Returned",
    className: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    icon: RotateCcw,
  },
};

export const deliveryStatusMeta: Record<DeliveryStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "border-muted-foreground/20 bg-muted text-muted-foreground" },
  courier_assigned: {
    label: "Courier Assigned",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  picked_up: {
    label: "Picked Up",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  in_transit: {
    label: "In Transit",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  delivered: {
    label: "Delivered",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  failed: { label: "Failed", className: "border-destructive/30 bg-destructive/10 text-destructive" },
  returned: {
    label: "Returned",
    className: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
};

export const settlementStatusMeta: Record<SettlementStatus, { label: string; className: string; icon: typeof Lock }> = {
  held: {
    label: "Held in Escrow",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: Lock,
  },
  ready_to_release: {
    label: "Ready to Release",
    className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    icon: Unlock,
  },
  released: {
    label: "Released",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CircleDollarSign,
  },
  failed: {
    label: "Failed",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
    icon: Banknote,
  },
};

export const orderStatuses: { value: OrderStatus; label: string }[] = (
  Object.keys(orderStatusMeta) as OrderStatus[]
).map((value) => ({ value, label: orderStatusMeta[value].label }));

export const courierProviders = ["BidChale", "GhanaPost", "Yango", "Bolt", "Speedaf", "DHL Express"];

export type AdminActionKind =
  | "initiate-delivery"
  | "mark-picked-up"
  | "mark-in-transit"
  | "mark-delivered"
  | "release-payment"
  | "retry-payout"
  | "view-receipt";

export function getAdminAction(order: FulfillmentDetail): AdminActionKind | null {
  if (order.settlement.status === "failed") return "retry-payout";
  if (order.settlement.status === "released" || order.status === "completed") return "view-receipt";

  if (order.delivery) {
    switch (order.delivery.status) {
      case "pending":
      case "courier_assigned":
        return "mark-picked-up";
      case "picked_up":
        return "mark-in-transit";
      case "in_transit":
        return "mark-delivered";
      case "delivered":
        return "release-payment";
      default:
        return null;
    }
  }

  switch (order.status) {
    case "payment_received":
    case "ready_for_pickup":
      return "initiate-delivery";
    case "delivered":
      return "release-payment";
    default:
      return null;
  }
}
