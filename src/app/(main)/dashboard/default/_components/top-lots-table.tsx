import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { TopLot } from "./overview";

interface Props {
  lots?: TopLot[];
}

type DisplayLot = {
  rank: number;
  title: string;
  sub: string;
  finalPrice: number;
  bids: number;
  img?: string;
};

const mockLots: DisplayLot[] = [
  {
    rank: 1,
    title: "Rolex Submariner Date (1985) — Ref. 16800, Box & Papers",
    sub: "Watches · Accra Luxury Traders",
    finalPrice: 7500,
    bids: 28,
    img: "https://picsum.photos/seed/watch-a/40/40",
  },
  {
    rank: 2,
    title: "Apple iPhone 15 Pro Max 256GB — Natural Titanium",
    sub: "Electronics · TechHub Ghana Ltd.",
    finalPrice: 4200,
    bids: 15,
    img: "https://picsum.photos/seed/phone-a/40/40",
  },
  {
    rank: 3,
    title: "22k Gold Rope Necklace Set — 45g, Hallmarked",
    sub: "Jewellery · Abena Gold & Jewels",
    finalPrice: 3850,
    bids: 22,
    img: "https://picsum.photos/seed/jewelry-a/40/40",
  },
  {
    rank: 4,
    title: 'Samsung 65" QLED 4K Smart TV — QN65QN90CAFXZA',
    sub: "Electronics · Dansoman Electronics",
    finalPrice: 3200,
    bids: 11,
    img: "https://picsum.photos/seed/tv-a/40/40",
  },
  {
    rank: 5,
    title: "Simpson Cleaning 4000 PSI Gas Pressure Washer",
    sub: "Home/Kitchen · Kofi Mensah Supplies",
    finalPrice: 1850,
    bids: 9,
    img: "https://picsum.photos/seed/washer-a/40/40",
  },
];

export function TopLotsTable({ lots }: Props) {
  const displayLots: DisplayLot[] = lots
    ? lots.map((l, i) => ({
        rank: i + 1,
        title: l.title,
        sub: l.auctionTitle ?? "—",
        finalPrice: l.currentBid,
        bids: l.bidCount,
        img: l.image,
      }))
    : mockLots;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Lots by Revenue</CardTitle>
        <CardDescription>Highest-grossing settled lots</CardDescription>
      </CardHeader>
      <CardContent className="relative px-0">
        <div className="max-h-80 overflow-x-hidden overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40">
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
              {displayLots.map((lot) => (
                <TableRow key={lot.rank}>
                  <TableCell>
                    <span className="text-muted-foreground text-sm tabular-nums">#{lot.rank}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {lot.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={lot.img} alt={lot.title} className="size-8 shrink-0 rounded-md border object-cover" />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted font-medium text-muted-foreground text-xs">
                          {lot.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{lot.title}</p>
                        <p className="truncate text-muted-foreground text-xs">{lot.sub}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm tabular-nums">GHS {lot.finalPrice.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm tabular-nums">{lot.bids}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </CardContent>
    </Card>
  );
}
