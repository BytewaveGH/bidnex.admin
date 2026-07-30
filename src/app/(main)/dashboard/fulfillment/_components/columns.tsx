"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { type FulfillmentOrderSummary, orderStatusMeta } from "./fulfillment-data";

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const columns: ColumnDef<FulfillmentOrderSummary>[] = [
  {
    accessorKey: "orderId",
    header: "Order",
    cell: ({ row }) => <span className="font-mono text-muted-foreground text-sm">#{row.getValue("orderId")}</span>,
  },
  {
    accessorKey: "lotTitle",
    header: "Lot",
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex items-center gap-3">
          <span className="block max-w-xs truncate font-medium text-sm">{order.lotTitle}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "buyerName",
    header: "Buyer",
    cell: ({ row }) => <span className="text-sm">{row.original.buyerName}</span>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-medium text-sm tabular-nums">GHS {row.original.amount.toFixed(2)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue("status") as FulfillmentOrderSummary["status"];
      const meta = orderStatusMeta[value];
      const label = meta?.label ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return (
        <Badge className={cn("gap-1.5 rounded-sm border font-medium", meta?.className)} variant="outline">
          {meta?.icon && <meta.icon className="size-4" />}
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue("createdAt"))}</span>,
  },
];
