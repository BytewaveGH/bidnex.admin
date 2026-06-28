import { MousePointerClick, TrendingUp, UserCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    icon: Users,
    label: "Registered Bidders",
    value: "4,218",
    badge: "+214 this month",
    sub: "Total verified accounts",
    variant: "default" as const,
  },
  {
    icon: UserCheck,
    label: "Active This Month",
    value: "1,342",
    badge: "31.8% of total",
    sub: "Placed at least one bid",
    variant: "default" as const,
  },
  {
    icon: TrendingUp,
    label: "New Registrations",
    value: "214",
    badge: "+12.4%",
    sub: "vs. last month's 190",
    variant: "default" as const,
  },
  {
    icon: MousePointerClick,
    label: "Avg Bids / Active User",
    value: "7.4",
    badge: "+0.8",
    sub: "vs. last month's 6.6",
    variant: "default" as const,
  },
];

export function AnalyticsUserStats() {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle>
                <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </div>
              </CardTitle>
              <CardDescription>{s.label}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{s.value}</div>
                <Badge variant={s.variant}>
                  <TrendingUp className="size-3" />
                  {s.badge}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">{s.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
