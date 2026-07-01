"use client";

import { useMemo, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
import { apiRequest } from "@/lib/api-client";

import type { IAuction } from "./_components/auction-data";
import { AuctionHeader } from "./_components/auction-header";
import { AuctionLots } from "./_components/auction-lots";
import { AuctionServices } from "./_logics/services";

interface ApiAuctionsResponse {
  data?: {
    count: number;
    page: number;
    limit: number;
    data: IAuction[];
  };
  status?: boolean;
}

interface AuctionStatsResponse {
  data?: {
    totalAuctions: number;
    activeAuctions: number;
    totalLots: number;
    liveBids: number;
  };
  status?: boolean;
}

const PAGE_SIZE = 5;

function preventNav(e: React.MouseEvent) {
  e.preventDefault();
}

export default function Page() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0); // 0-indexed internally

  function handleSearchCommit() {
    setSearch(searchInput);
    setPage(0);
  }

  const svc = AuctionServices.FetchAll({
    search: search || undefined,
    page: page + 1,
    limit: PAGE_SIZE,
  });

  const {
    data: res,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-auctions", search, page],
    queryFn: () => apiRequest<ApiAuctionsResponse>(svc.endpoint, token, { params: svc.params }),
    enabled: sessionStatus === "authenticated",
    placeholderData: (prev) => prev,
  });

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["auction-stats"],
    queryFn: () => apiRequest<AuctionStatsResponse>("/admin/auctions/stats", token),
    enabled: sessionStatus === "authenticated",
    staleTime: 60_000,
  });

  const auctions: IAuction[] = res?.data?.data ?? [];
  const totalCount = res?.data?.count ?? 0;
  const stats = statsRes?.data;

  const pageCount = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1);
  const currentPage = page + 1;

  const pageNumbers = useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
    void queryClient.invalidateQueries({ queryKey: ["auction-stats"] });
  }

  const kpiLoading = statsLoading || sessionStatus === "loading";

  return (
    <div className="flex flex-col gap-6">
      <AuctionHeader
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSearchCommit={handleSearchCommit}
        onRefresh={handleRefresh}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Auctions</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            {kpiLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-3xl leading-none tracking-tight">{stats?.totalAuctions ?? "—"}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Lots</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            {kpiLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-3xl leading-none tracking-tight">{stats?.totalLots ?? "—"}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Auctions</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            {kpiLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-3xl leading-none tracking-tight">{stats?.activeAuctions ?? "—"}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Live Bids</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            {kpiLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-3xl leading-none tracking-tight">{stats?.liveBids ?? "—"}</span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading && (
          <>
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </>
        )}
        {!isLoading && auctions.length === 0 && (
          <div className="flex min-h-40 items-center justify-center rounded-xl border bg-card text-muted-foreground text-sm">
            No auctions found
          </div>
        )}
        {!isLoading &&
          auctions.length > 0 &&
          auctions.map((auction) => <AuctionLots key={auction.id} auction={auction} />)}
      </div>

      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            {totalCount} {totalCount === 1 ? "auction" : "auctions"}
            {isFetching && !isLoading && <span className="ml-2 text-xs">Refreshing…</span>}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={page === 0 ? "pointer-events-none opacity-50" : undefined}
                  onClick={(e) => {
                    preventNav(e);
                    setPage((p) => Math.max(0, p - 1));
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
                      setPage(n - 1);
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
                  className={page >= pageCount - 1 ? "pointer-events-none opacity-50" : undefined}
                  onClick={(e) => {
                    preventNav(e);
                    setPage((p) => Math.min(pageCount - 1, p + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
