"use client";
"use no memo";

import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
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
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

import { OverdueCheckoutServices } from "../_logics/services";
import type { OverdueLot } from "./overdue-lot-data";

// ── API normalisation ──────────────────────────────────────────────────────────

interface ApiOverdueResponse {
  data?: {
    count?: number;
    page?: number;
    limit?: number;
    data?: OverdueLot[];
  };
  status?: boolean;
}

function normalise(res: ApiOverdueResponse): { lots: OverdueLot[]; total: number } {
  const inner = res?.data;
  const lots = inner?.data ?? [];
  const total = inner?.count ?? lots.length;
  return { lots, total };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function getHoursOverdue(lot: OverdueLot): number {
  if (lot.hoursOverdue !== undefined) return lot.hoursOverdue;
  if (lot.checkoutDeadline) {
    const diff = Date.now() - new Date(lot.checkoutDeadline).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  }
  // Fallback: time elapsed since auction ended (bidEndTime)
  if (lot.bidEndTime) {
    const diff = Date.now() - new Date(lot.bidEndTime).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  }
  return 0;
}

function formatOverdue(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) return `${days}d ${remainingHours}h`;
  return `${hours}h`;
}

function OverdueBadge({ lot }: { lot: OverdueLot }) {
  const hours = getHoursOverdue(lot);
  const label = formatOverdue(hours);

  if (hours >= 72) {
    return <Badge variant="destructive">{label}</Badge>;
  }

  if (hours >= 24) {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
      {label}
    </Badge>
  );
}

function preventNav(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

// ── Relist confirmation dialog ─────────────────────────────────────────────────

interface RelistDialogProps {
  lot: OverdueLot | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function RelistDialog({ lot, isPending, onConfirm, onCancel }: RelistDialogProps) {
  return (
    <AlertDialog open={lot !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Relist this lot?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-3">
              <p>
                This will cancel{" "}
                <span className="font-medium text-foreground">
                  {lot?.winnerName ?? (lot?.winnerId ? `User #${lot.winnerId}` : "the winner")}
                </span>
                &apos;s claim and return <span className="font-medium text-foreground">{lot?.title}</span> to the lot
                pool for reassignment.
              </p>
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-destructive text-xs leading-relaxed">
                This action cannot be undone. The buyer will lose their winning status and any pending payment will be
                voided.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <RefreshCw className="animate-spin" />
                Relisting…
              </>
            ) : (
              "Confirm Relist"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Column factory ─────────────────────────────────────────────────────────────

function makeColumns(onRequestRelist: (lot: OverdueLot) => void, relistingId: number | null): ColumnDef<OverdueLot>[] {
  return [
    {
      accessorKey: "title",
      header: "Lot",
      cell: ({ row }) => {
        const lot = row.original;
        return (
          <div className="flex items-center gap-3">
            {lot.primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lot.primaryImage} alt="" className="size-9 shrink-0 rounded-md border object-cover" />
            ) : (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted font-medium text-muted-foreground text-xs">
                {lot.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="max-w-xs truncate font-medium text-sm" title={lot.title}>
                {lot.title}
              </p>
              <p className="text-muted-foreground text-xs">#{lot.id}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: "winner",
      header: "Winner",
      cell: ({ row }) => {
        const lot = row.original;
        // Backend returns winnerId only; name/email may be added in future
        if (lot.winnerName) {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">{lot.winnerName}</span>
              {lot.winnerEmail && (
                <a
                  href={`mailto:${lot.winnerEmail}`}
                  className="text-muted-foreground text-xs hover:text-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lot.winnerEmail}
                </a>
              )}
            </div>
          );
        }
        if (lot.winnerId) {
          return <span className="font-medium text-sm">User #{lot.winnerId}</span>;
        }
        return <span className="text-muted-foreground text-sm">—</span>;
      },
    },
    {
      accessorKey: "currentBid",
      header: "Winning Bid",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm tabular-nums">GHS {row.original.currentBid.toFixed(2)}</span>
          {row.original.bidCount !== undefined && (
            <span className="text-muted-foreground text-xs">
              {row.original.bidCount} bid{row.original.bidCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "ended",
      header: "Auction Ended",
      cell: ({ row }) => {
        const lot = row.original;
        const iso = lot.bidEndTime ?? lot.checkoutDeadline;
        if (!iso) return <span className="text-muted-foreground text-sm">—</span>;
        return <span className="text-sm">{formatDate(iso)}</span>;
      },
    },
    {
      id: "overdue",
      header: "Overdue",
      cell: ({ row }) => <OverdueBadge lot={row.original} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const lot = row.original;
        const isRelisting = relistingId === lot.id;
        return (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={isRelisting}
              onClick={(e) => {
                e.stopPropagation();
                onRequestRelist(lot);
              }}
            >
              <RefreshCw className={isRelisting ? "animate-spin" : ""} />
              Relist
            </Button>
          </div>
        );
      },
    },
  ];
}

// ── Component ──────────────────────────────────────────────────────────────────

export function OverdueCheckoutList() {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const [page, setPage] = React.useState(0);
  const [pageSize] = React.useState(10);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  // Controls the confirmation dialog; null = closed
  const [pendingRelist, setPendingRelist] = React.useState<OverdueLot | null>(null);
  const [relistingId, setRelistingId] = React.useState<number | null>(null);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setSearch(searchInput);
      setPage(0);
    }
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const {
    data: raw,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-overdue-checkout", page, pageSize, search],
    queryFn: () => {
      const svc = OverdueCheckoutServices.FetchAll({
        page: page + 1,
        limit: pageSize,
        ...(search ? { search } : {}),
      });
      return apiRequest<ApiOverdueResponse>(svc.endpoint, token, { params: svc.params });
    },
    enabled: sessionStatus === "authenticated",
    placeholderData: (prev) => prev,
  });

  const { lots, total } = React.useMemo(() => normalise(raw ?? {}), [raw]);

  // ── Relist mutation ────────────────────────────────────────────────────────

  const relistMutation = useMutation({
    mutationFn: (lot: OverdueLot) => {
      const svc = OverdueCheckoutServices.RelistLot(lot.id);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onMutate: (lot) => {
      setRelistingId(lot.id);
      setPendingRelist(null);
    },
    onSuccess: (_, lot) => {
      toast.success(`"${lot.title}" has been relisted.`);
      void queryClient.invalidateQueries({ queryKey: ["admin-overdue-checkout"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to relist lot.");
    },
    onSettled: () => setRelistingId(null),
  });

  // ── Table ──────────────────────────────────────────────────────────────────

  const columns = React.useMemo(() => makeColumns((lot) => setPendingRelist(lot), relistingId), [relistingId]);

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
  });

  const currentPage = page + 1;
  const pageNumbers = React.useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  return (
    <>
      <RelistDialog
        lot={pendingRelist}
        isPending={relistMutation.isPending}
        onConfirm={() => {
          if (pendingRelist) relistMutation.mutate(pendingRelist);
        }}
        onCancel={() => setPendingRelist(null)}
      />

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 leading-none">
              <Clock className="size-4 text-destructive" />
              Overdue Lots
              {isFetching && !isLoading && (
                <span className="ml-1 font-normal text-muted-foreground text-xs">Refreshing…</span>
              )}
            </CardTitle>
            <CardDescription>Winners who have not completed checkout within the allowed window.</CardDescription>
            <CardAction>
              <Input
                className="h-7 w-44 md:w-52"
                placeholder="Search lots…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
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
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                        No overdue lots found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between gap-4 px-4 pb-1">
              <p className="text-muted-foreground text-sm">
                {total} overdue {total === 1 ? "lot" : "lots"}
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
    </>
  );
}
