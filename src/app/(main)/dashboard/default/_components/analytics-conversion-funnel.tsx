import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stages = [
  { label: "Lots Listed", count: 1840, pct: 100 },
  { label: "Submitted for Review", count: 1420, pct: 77 },
  { label: "Approved", count: 1102, pct: 78 },
  { label: "Went Live", count: 986, pct: 89 },
  { label: "Received Bids", count: 768, pct: 78 },
  { label: "Reserve Met", count: 492, pct: 64 },
  { label: "Settled", count: 471, pct: 96 },
];

export function AnalyticsConversionFunnel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auction Conversion Funnel</CardTitle>
        <CardDescription>End-to-end lot journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {stages.map((stage, index) => (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-muted-foreground text-sm">{stage.label}</span>
              <div className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 items-center justify-center rounded-md transition-all",
                    index === 0 && "bg-primary",
                    index === 1 && "bg-primary/90",
                    index === 2 && "bg-primary/80",
                    index === 3 && "bg-primary/70",
                    index === 4 && "bg-primary/60",
                    index === 5 && "bg-primary/50",
                    index === 6 && "bg-primary/40",
                  )}
                  style={{ width: `${stage.pct}%` }}
                >
                  <span className="px-2 font-medium text-primary-foreground text-xs">{stage.pct}%</span>
                </div>
              </div>
              <span className="w-16 text-right font-semibold text-sm tabular-nums">{stage.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-muted-foreground text-xs">Overall conversion: 25.6% (Lots Listed → Settled)</p>
      </CardContent>
    </Card>
  );
}
