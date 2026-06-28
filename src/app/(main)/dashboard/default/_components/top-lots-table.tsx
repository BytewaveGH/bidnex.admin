import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const lots = [
  {
    rank: 1,
    title: "Rolex Submariner Date (1985) — Ref. 16800, Box & Papers",
    category: "Watches",
    finalPrice: 7500,
    bids: 28,
    vendor: "Accra Luxury Traders",
    img: "https://picsum.photos/seed/watch-a/40/40",
  },
  {
    rank: 2,
    title: "Apple iPhone 15 Pro Max 256GB — Natural Titanium",
    category: "Electronics",
    finalPrice: 4200,
    bids: 15,
    vendor: "TechHub Ghana Ltd.",
    img: "https://picsum.photos/seed/phone-a/40/40",
  },
  {
    rank: 3,
    title: "22k Gold Rope Necklace Set — 45g, Hallmarked",
    category: "Jewellery",
    finalPrice: 3850,
    bids: 22,
    vendor: "Abena Gold & Jewels",
    img: "https://picsum.photos/seed/jewelry-a/40/40",
  },
  {
    rank: 4,
    title: 'Samsung 65" QLED 4K Smart TV — QN65QN90CAFXZA',
    category: "Electronics",
    finalPrice: 3200,
    bids: 11,
    vendor: "Dansoman Electronics",
    img: "https://picsum.photos/seed/tv-a/40/40",
  },
  {
    rank: 5,
    title: "Simpson Cleaning 4000 PSI Gas Pressure Washer",
    category: "Home/Kitchen",
    finalPrice: 1850,
    bids: 9,
    vendor: "Kofi Mensah Supplies",
    img: "https://picsum.photos/seed/washer-a/40/40",
  },
];

export function TopLotsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Lots by Revenue</CardTitle>
        <CardDescription>Highest-grossing settled lots</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-xs">Rank</TableHead>
              <TableHead className="text-xs">Lot</TableHead>
              <TableHead className="text-xs">Final Price</TableHead>
              <TableHead className="w-12 text-xs">Bids</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot) => (
              <TableRow key={lot.rank}>
                <TableCell>
                  <span className="text-muted-foreground text-sm tabular-nums">#{lot.rank}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lot.img} alt={lot.title} className="size-8 shrink-0 rounded-md border object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{lot.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {lot.category} · {lot.vendor}
                      </p>
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
      </CardContent>
    </Card>
  );
}
