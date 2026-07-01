import Link from "next/link";

import { AlertTriangle, ChevronRight, DollarSign, Package, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { ActionsNeededData } from "./overview";

interface Props {
  actionsNeeded?: ActionsNeededData;
}

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

export function ActionsNeeded({ actionsNeeded }: Props) {
  const actions = [
    {
      label: "Lots pending review",
      count: actionsNeeded?.pendingLots ?? 3,
      href: "/dashboard/vendor-lots",
      icon: Package,
      urgency: "warning" as const,
    },
    {
      label: "Disputes awaiting response",
      count: actionsNeeded?.openDisputes ?? 2,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions Needed</CardTitle>
        <CardDescription>Pending items requiring your attention</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col overflow-y-auto max-h-52 scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40">
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
        <div className="pointer-events-none sticky bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </CardContent>
    </Card>
  );
}
