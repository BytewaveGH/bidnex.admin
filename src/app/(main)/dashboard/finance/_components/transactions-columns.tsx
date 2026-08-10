"use client";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { Payout, PayoutStatus } from "../_logics/services";

const statusMeta: Record<PayoutStatus, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  failed: {
    label: "Failed",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  pending_review: {
    label: "Pending Review",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
};

function formatCurrency(amount: number) {
  return `GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const transactionsColumns: ColumnDef<Payout>[] = [
  {
    accessorKey: "id",
    header: "Payout",
    cell: ({ row }) => <span className="font-mono text-muted-foreground text-sm">#{row.getValue("id")}</span>,
  },
  {
    accessorKey: "lotTitle",
    header: "Lot",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/vendor-lots/${row.original.lotId}`}
        className="inline-flex max-w-56 items-center gap-1 truncate text-sm hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate">{row.original.lotTitle || `Lot #${row.original.lotId}`}</span>
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      </Link>
    ),
  },
  {
    accessorKey: "vendorName",
    header: "Vendor",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.vendorName} <span className="text-muted-foreground">#{row.original.vendorId}</span>
      </span>
    ),
  },
  {
    accessorKey: "grossAmount",
    header: "Gross",
    cell: ({ row }) => <span className="text-sm">{formatCurrency(row.original.grossAmount)}</span>,
  },
  {
    accessorKey: "platformCharge",
    header: "Platform Fee",
    cell: ({ row }) => <span className="text-sm">{formatCurrency(row.original.platformCharge)}</span>,
  },
  {
    accessorKey: "transferAmount",
    header: "Transferred",
    cell: ({ row }) => <span className="font-medium text-sm">{formatCurrency(row.original.transferAmount)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue("status") as PayoutStatus;
      const meta = statusMeta[value];
      const badge = (
        <Badge variant="outline" className={cn("gap-1.5 rounded-sm border font-medium", meta?.className)}>
          {meta?.label ?? value}
        </Badge>
      );

      if (value !== "failed" || !row.original.failureReason) return badge;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1.5">
              {badge}
              <AlertTriangle className="size-3.5 text-destructive" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs break-words">
            {row.original.failureReason}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue("createdAt"))}</span>,
  },
];
