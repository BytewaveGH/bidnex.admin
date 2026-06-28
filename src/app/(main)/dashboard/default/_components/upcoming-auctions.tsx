import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const upcoming = [
  {
    id: 1,
    title: "Vintage Omega Seamaster 300 — Ref. ST 165.024",
    category: "Watches",
    vendor: "Accra Luxury Traders",
    startingBid: 3200,
    startsIn: "1h 45m",
  },
  {
    id: 2,
    title: "Sony PlayStation 5 Digital Edition — Bundle",
    category: "Electronics",
    vendor: "TechHub Ghana Ltd.",
    startingBid: 2100,
    startsIn: "3h 20m",
  },
  {
    id: 3,
    title: "14k Diamond Tennis Bracelet — 2.4ct",
    category: "Jewellery",
    vendor: "Abena Gold & Jewels",
    startingBid: 4500,
    startsIn: "6h 00m",
  },
  {
    id: 4,
    title: "Nikon Z6 III Mirrorless Camera Body",
    category: "Photography",
    vendor: "Accra Luxury Traders",
    startingBid: 5800,
    startsIn: "11h 30m",
  },
  {
    id: 5,
    title: "Eames Lounge Chair & Ottoman — Walnut",
    category: "Furniture",
    vendor: "Kofi Mensah Supplies",
    startingBid: 6200,
    startsIn: "18h 00m",
  },
];

export function UpcomingAuctions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Auctions</CardTitle>
        <CardDescription>Scheduled to go live soon</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {upcoming.map((item, index) => (
          <div key={item.id}>
            <div className="flex items-center justify-between gap-3 px-6 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{item.title}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {item.category}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{item.vendor}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-medium text-sm tabular-nums">GHS {item.startingBid.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs">Starts in {item.startsIn}</p>
              </div>
            </div>
            {index < upcoming.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
