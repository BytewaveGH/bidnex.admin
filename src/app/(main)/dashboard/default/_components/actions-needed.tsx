import Link from "next/link";

import { AlertTriangle, ChevronRight, DollarSign, Package, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const actions = [
  {
    label: "Lots pending review",
    count: 3,
    href: "/dashboard/vendor-lots",
    icon: Package,
    urgency: "warning" as const,
  },
  {
    label: "Disputes awaiting response",
    count: 2,
    href: "/dashboard/disputes",
    icon: AlertTriangle,
    urgency: "destructive" as const,
  },
  {
    label: "Vendors pending approval",
    count: 5,
    href: "/dashboard/vendor-lots",
    icon: Users,
    urgency: "warning" as const,
  },
  {
    label: "Payments to reconcile",
    count: 1,
    href: "/dashboard/auctions",
    icon: DollarSign,
    urgency: "default" as const,
  },
];

type Urgency = "warning" | "destructive" | "default";

function iconColorClass(urgency: Urgency) {
  if (urgency === "warning") return "text-amber-600";
  if (urgency === "destructive") return "text-destructive";
  return "text-muted-foreground";
}

function ActionBadge({ urgency, count }: { urgency: Urgency; count: number }) {
  if (urgency === "warning") {
    return (
      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
        {count}
      </Badge>
    );
  }
  if (urgency === "destructive") {
    return <Badge variant="destructive">{count}</Badge>;
  }
  return <Badge variant="secondary">{count}</Badge>;
}

export function ActionsNeeded() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions Needed</CardTitle>
        <CardDescription>Pending items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div key={action.label}>
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2.5">
                  <Icon className={`size-4 ${iconColorClass(action.urgency)}`} />
                  <span className="text-sm">{action.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ActionBadge urgency={action.urgency} count={action.count} />
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={action.href}>
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              {index < actions.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
