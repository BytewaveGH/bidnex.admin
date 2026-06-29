"use client";
"use no memo";

import * as React from "react";

import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronDownIcon, Eye, ListFilter } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { VendorLotServices } from "../_logics/services";
import type { LotReviewStatus, VendorLot } from "./vendor-lots-data";

// ── API response normalisation ────────────────────────────────────────────────

interface ApiLotsResponse {
  data?: {
    count?: number;
    page?: number;
    limit?: number;
    data?: VendorLot[];
  };
}

function normalise(res: ApiLotsResponse): { lots: VendorLot[]; total: number } {
  const inner = res?.data;
  const lots = inner?.data ?? [];
  const total = inner?.count ?? lots.length;
  return { lots, total };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LotsStatsResponse {
  data?: {
    total: number;
    byReviewStatus: Record<LotReviewStatus, number>;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const reviewStatusOptions = ["all", "draft", "submitted", "approved", "rejected"] as const;

const reviewStatusMeta: Record<LotReviewStatus, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  draft: {
    label: "Draft",
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function preventNav(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

// ── Column factory ────────────────────────────────────────────────────────────

function makeColumns(onView: (id: number, e: React.MouseEvent) => void): ColumnDef<VendorLot>[] {
  return [
    {
      accessorKey: "title",
      header: "Lot Title",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.primaryImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.primaryImage} alt="" className="size-9 shrink-0 rounded-md border object-cover" />
          )}
          <div className="max-w-xs truncate font-medium text-sm" title={row.original.title}>
            {row.original.title}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "vendorId",
      header: "Vendor",
      cell: ({ row }) => (
        <div className="flex flex-col">
          {row.original.vendorName && <span className="font-medium text-sm">{row.original.vendorName}</span>}
          <span className="text-muted-foreground text-xs">#{row.original.vendorId}</span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div className="text-sm">{row.original.category.name}</div>,
    },
    {
      accessorKey: "condition",
      header: "Condition",
      cell: ({ row }) => <div className="text-sm capitalize">{row.original.condition.replace(/_/g, " ")}</div>,
    },
    {
      accessorKey: "startingBid",
      header: "Starting Bid",
      cell: ({ row }) => (
        <div className="font-medium text-sm tabular-nums">GHS {row.original.startingBid.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "reservePrice",
      header: "Reserve",
      cell: ({ row }) => (
        <div className="font-medium text-sm tabular-nums">GHS {row.original.reservePrice.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "reviewStatus",
      header: "Status",
      cell: ({ row }) => {
        const meta = reviewStatusMeta[row.original.reviewStatus];
        return (
          <Badge variant="outline" className={cn("rounded-full px-2.5", meta.className)}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      cell: ({ row }) => <div className="text-sm">{formatDate(row.original.createdAt)}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Review</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:bg-transparent focus-visible:bg-transparent"
            onClick={(e) => onView(row.original.id, e)}
          >
            <Eye />
            <span className="sr-only">Review lot</span>
          </Button>
        </div>
      ),
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VendorLotsList() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  // ── Filter & pagination state ─────────────────────────────────────────────
  const [page, setPage] = React.useState(0);
  const [pageSize] = React.useState(10);
  const [reviewStatusFilter, setReviewStatusFilter] = React.useState("all");
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  function resetPage() {
    setPage(0);
  }

  function handleStatusChange(value: string) {
    setReviewStatusFilter(value);
    resetPage();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setSearch(searchInput);
      resetPage();
    }
  }

  // ── Stats (reads from cache populated by page.tsx) ────────────────────────
  const { data: statsRes } = useQuery({
    queryKey: ["admin-lots-stats"],
    queryFn: () => apiRequest<LotsStatsResponse>(VendorLotServices.FetchStats().endpoint, token),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });
  const byStatus = statsRes?.data?.byReviewStatus;
  const statsTotal = statsRes?.data?.total;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const {
    data: raw,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-lots", page, pageSize, reviewStatusFilter, search],
    queryFn: async () => {
      const svc = VendorLotServices.FetchAll({
        page: page + 1,
        limit: pageSize,
        ...(reviewStatusFilter !== "all" ? { reviewStatus: reviewStatusFilter } : {}),
        ...(search ? { search } : {}),
      });
      return apiRequest<ApiLotsResponse>(svc.endpoint, token, { params: svc.params });
    },
    enabled: sessionStatus === "authenticated",
    placeholderData: (prev) => prev,
  });

  const { lots, total } = React.useMemo(() => normalise(raw ?? {}), [raw]);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = React.useMemo(
    () =>
      makeColumns((id, e) => {
        e.stopPropagation();
        router.push(`/dashboard/vendor-lots/${id}`);
      }),
    [router],
  );

  // ── Table ─────────────────────────────────────────────────────────────────
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  const table = useReactTable({
    data: lots,
    columns,
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
    getSortedRowModel: getSortedRowModel(),
  });

  const currentPage = page + 1;
  const pageNumbers = React.useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle className="leading-none">
            Vendor Lots
            {isFetching && !isLoading && (
              <span className="ml-2 font-normal text-muted-foreground text-xs">Refreshing…</span>
            )}
          </CardTitle>
          <CardDescription>
            Review and approve lots submitted by vendors before assigning them to auctions.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <Input
                className="h-7 w-44 md:w-52"
                placeholder="Search lots…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ListFilter data-icon="inline-start" />
                    Review Status
                    <ChevronDownIcon data-icon="inline-end" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuRadioGroup value={reviewStatusFilter} onValueChange={handleStatusChange}>
                    {reviewStatusOptions.map((opt) => {
                      const count = opt === "all" ? statsTotal : byStatus?.[opt as LotReviewStatus];
                      return (
                        <DropdownMenuRadioItem key={opt} value={opt}>
                          <span className="flex-1">
                            {opt === "all" ? "All statuses" : (reviewStatusMeta[opt as LotReviewStatus]?.label ?? opt)}
                          </span>
                          {count !== undefined && (
                            <span className="ml-2 text-muted-foreground text-xs tabular-nums">{count}</span>
                          )}
                        </DropdownMenuRadioItem>
                      );
                    })}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="overflow-hidden">
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columns.length} className="py-3">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/dashboard/vendor-lots/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 pb-1">
            <p className="text-muted-foreground text-sm">
              {total} {total === 1 ? "lot" : "lots"}
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
    </section>
  );
}
