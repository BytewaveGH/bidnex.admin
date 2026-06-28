import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const earnings = [
  { label: "Gross Revenue", value: "GHS 549,300", change: "+14.2%", up: true },
  { label: "Platform Fee (5%)", value: "GHS 27,465", change: "+14.2%", up: true },
  { label: "Vendor Payouts", value: "GHS 521,835", change: "+14.1%", up: true },
  { label: "Pending Reconciliation", value: "GHS 8,240", change: "3 lots", up: false },
];

const breakdown = [
  { category: "Watches", fees: 9375, pct: 34 },
  { category: "Electronics", fees: 7115, pct: 26 },
  { category: "Jewellery", fees: 4935, pct: 18 },
  { category: "Home/Kitchen", fees: 2705, pct: 10 },
  { category: "Other", fees: 3335, pct: 12 },
];

export function AnalyticsPlatformEarnings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Earnings</CardTitle>
        <CardDescription>Revenue and fees — current month</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {earnings.map((item) => (
            <div key={item.label} className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3">
              <p className="text-muted-foreground text-xs">{item.label}</p>
              <p className="font-semibold text-xl tabular-nums">{item.value}</p>
              <p
                className={cn("text-xs", item.up ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}
              >
                {item.change}
              </p>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <p className="font-medium text-sm">Fee breakdown by category</p>
          {breakdown.map((item) => (
            <div key={item.category} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-muted-foreground text-xs">{item.category}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
              </div>
              <span className="w-16 text-right font-medium text-xs tabular-nums">GHS {item.fees.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
