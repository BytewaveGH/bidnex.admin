"use client";
"use no memo";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Receipt } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/api-client";

import { FinanceServices, type Payout, type PayoutStatus } from "../_logics/services";
import { transactionsColumns } from "./transactions-columns";

const statusOptions: Array<{ value: PayoutStatus; label: string }> = [
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "pending_review", label: "Pending Review" },
];

interface ApiPayoutsResponse {
  data?: { count?: number; page?: number; limit?: number; data?: Payout[] };
  status?: boolean;
}

function normalise(res: ApiPayoutsResponse): { payouts: Payout[]; total: number } {
  const inner = res.data;
  const payouts = inner?.data ?? [];
  const total = inner?.count ?? payouts.length;
  return { payouts, total };
}

function preventNav(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

export function TransactionsTable() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const [page, setPage] = React.useState(0);
  const [pageSize] = React.useState(20);
  const [status, setStatus] = React.useState<PayoutStatus | "all">("all");

  const {
    data: raw,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-finance-payouts", page, pageSize, status],
    queryFn: () => {
      const svc = FinanceServices.FetchPayouts({
        page: page + 1,
        limit: pageSize,
        ...(status !== "all" ? { status } : {}),
      });
      return apiRequest<ApiPayoutsResponse>(svc.endpoint, token, { params: svc.params });
    },
    enabled: sessionStatus === "authenticated",
    placeholderData: (prev) => prev,
  });

  const { payouts, total } = React.useMemo(() => normalise(raw ?? {}), [raw]);
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  const table = useReactTable({
    data: payouts,
    columns: transactionsColumns,
    pageCount,
    state: { pagination: { pageIndex: page, pageSize } },
    getRowId: (row) => String(row.id),
    manualPagination: true,
    manualFiltering: true,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex: page, pageSize }) : updater;
      setPage(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const currentPage = page + 1;
  const pageNumbers = React.useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 leading-none">
            <Receipt className="size-4" />
            Payout Transactions
            {isFetching && !isLoading && (
              <span className="ml-1 font-normal text-muted-foreground text-xs">Refreshing…</span>
            )}
          </CardTitle>
          <CardDescription>All outgoing vendor payouts processed by the platform.</CardDescription>
          <CardAction className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as PayoutStatus | "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="h-7 w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-0">
          <div className="overflow-x-auto">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4">
              <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-medium **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-row']:hover:bg-transparent">
                {isLoading &&
                  ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((key) => (
                    <TableRow key={key}>
                      <TableCell colSpan={transactionsColumns.length} className="py-3">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!isLoading &&
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!isLoading && table.getRowModel().rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={transactionsColumns.length}
                      className="h-32 text-center text-muted-foreground text-sm"
                    >
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 pb-1">
            <p className="text-muted-foreground text-sm">
              {total} {total === 1 ? "transaction" : "transactions"}
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent className="gap-1.5">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : undefined}
                    onClick={(e) => {
                      preventNav(e);
                      table.previousPage();
                    }}
                  />
                </PaginationItem>
                {pageNumbers[0] > 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {pageNumbers.map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      href="#"
                      isActive={page === n - 1}
                      onClick={(e) => {
                        preventNav(e);
                        table.setPageIndex(n - 1);
                      }}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {pageNumbers[pageNumbers.length - 1] < pageCount && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
                    onClick={(e) => {
                      preventNav(e);
                      table.nextPage();
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
