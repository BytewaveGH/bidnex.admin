"use client";
"use no memo";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Smartphone } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

import { FinanceServices } from "../_logics/services";
import type { VendorPayoutAccount } from "./accounts-data";

const PAGE_SIZE = 20;

interface ApiResponse {
  data?: { count?: number; page?: number; limit?: number; data?: VendorPayoutAccount[] };
  status?: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function preventNav(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

export function AccountsTable() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;
  const [page, setPage] = React.useState(0);

  const {
    data: raw,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["admin-payout-accounts", page],
    queryFn: () => {
      const svc = FinanceServices.FetchPayoutAccounts({ page: page + 1, limit: PAGE_SIZE });
      return apiRequest<ApiResponse>(svc.endpoint, token, { params: svc.params });
    },
    enabled: sessionStatus === "authenticated",
    placeholderData: (prev) => prev,
  });

  const accounts = raw?.data?.data ?? [];
  const total = raw?.data?.count ?? 0;
  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const currentPage = page + 1;

  const pageNumbers = React.useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">
          Vendor Payout Accounts
          {isFetching && !isLoading && (
            <span className="ml-2 font-normal text-muted-foreground text-xs">Refreshing…</span>
          )}
        </CardTitle>
        <CardDescription>All registered payout accounts across vendors. Read-only.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="overflow-x-auto">
          <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4">
            <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-medium **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Account No</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-row']:hover:bg-transparent">
              {isLoading &&
                ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((key) => (
                  <TableRow key={key}>
                    <TableCell colSpan={7} className="py-3">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading &&
                accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <span className="font-mono text-muted-foreground text-sm">#{account.vendorId}</span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{account.accountName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1.5 rounded-sm border font-medium",
                          account.type === "mobile_money"
                            ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                            : "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
                        )}
                      >
                        {account.type === "mobile_money" ? (
                          <Smartphone className="size-3.5" />
                        ) : (
                          <Banknote className="size-3.5" />
                        )}
                        {account.type === "mobile_money" ? "Mobile Money" : "Bank Transfer"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{account.provider}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-sm">{account.accountNo}</TableCell>
                    <TableCell>
                      {account.isDefault && (
                        <Badge
                          variant="outline"
                          className="rounded-sm border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-300"
                        >
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(account.createdAt)}</TableCell>
                  </TableRow>
                ))}

              {!isLoading && accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                    No payout accounts registered.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-4 px-4 pb-1">
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "account" : "accounts"}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={page === 0 ? "pointer-events-none opacity-50" : undefined}
                  onClick={(e) => {
                    preventNav(e);
                    if (page > 0) setPage(page - 1);
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
                    if (page < pageCount - 1) setPage(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
