import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { TopLot } from "./overview";

interface Props {
  lots?: TopLot[];
  isLoading?: boolean;
}

export function TopLotsTable({ lots, isLoading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Lots by Revenue</CardTitle>
        <CardDescription>Highest-grossing settled lots</CardDescription>
      </CardHeader>
      <CardContent className="relative px-0">
        <div className="max-h-80 overflow-x-hidden overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40">
          {isLoading ? (
            <Table className="table-fixed **:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-10 text-xs">Rank</TableHead>
                  <TableHead className="text-xs">Lot</TableHead>
                  <TableHead className="w-28 text-xs">Final Price</TableHead>
                  <TableHead className="w-12 text-xs">Bids</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-6" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 shrink-0 rounded-md" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-6" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : !lots || lots.length === 0 ? (
            <p className="px-4 py-4 text-muted-foreground text-sm">No lot data yet.</p>
          ) : (
            <Table className="table-fixed **:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-10 text-xs">Rank</TableHead>
                  <TableHead className="text-xs">Lot</TableHead>
                  <TableHead className="w-28 text-xs">Final Price</TableHead>
                  <TableHead className="w-12 text-xs">Bids</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.map((lot, index) => (
                  <TableRow key={lot.id}>
                    <TableCell>
                      <span className="text-muted-foreground text-sm tabular-nums">#{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {lot.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={lot.image}
                            alt={lot.title}
                            className="size-8 shrink-0 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted font-medium text-muted-foreground text-xs">
                            {lot.title.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm">{lot.title}</p>
                          <p className="truncate text-muted-foreground text-xs">{lot.auctionTitle ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm tabular-nums">GHS {lot.currentBid.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">{lot.bidCount}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </CardContent>
    </Card>
  );
}
