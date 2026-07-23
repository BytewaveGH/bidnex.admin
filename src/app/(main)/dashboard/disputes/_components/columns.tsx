"use client";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { type Dispute, statuses } from "./dispute-data";

const statusStyles: Record<string, string> = {
  open: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  underReview: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  resolved: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  closed: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const columns: ColumnDef<Dispute>[] = [
  {
    accessorKey: "id",
    header: "Dispute",
    cell: ({ row }) => <span className="font-mono text-muted-foreground text-sm">#{row.getValue("id")}</span>,
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => <span className="block max-w-md truncate font-medium text-sm">{row.getValue("reason")}</span>,
  },
  {
    accessorKey: "lotId",
    header: "Lot",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/vendor-lots/${row.original.lotId}`}
        className="inline-flex items-center gap-1 text-sm hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        #{row.original.lotId}
        <ExternalLink className="size-3.5 text-muted-foreground" />
      </Link>
    ),
  },
  {
    accessorKey: "buyerId",
    header: "Buyer",
    cell: ({ row }) => <span className="text-sm">#{row.original.buyerId}</span>,
  },
  {
    accessorKey: "sellerId",
    header: "Seller",
    cell: ({ row }) => <span className="text-sm">{row.original.sellerId ? `#${row.original.sellerId}` : "—"}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue("status") as string;
      const status = statuses.find((s) => s.value === value);

      return (
        <Badge className={cn("gap-1.5 rounded-sm border font-medium", statusStyles[value])} variant="outline">
          {status?.icon && <status.icon className="size-4" />}
          {status?.label ?? value}
        </Badge>
      );
    },
  },
  {
    accessorKey: "filedAt",
    header: "Filed",
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue("filedAt"))}</span>,
  },
];
