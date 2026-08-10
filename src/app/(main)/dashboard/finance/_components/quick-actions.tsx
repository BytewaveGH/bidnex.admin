import Link from "next/link";

import { AlertCircle, Clock, Gavel, Megaphone, Package, ShieldAlert, Truck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const payoutShortcuts = [
  {
    id: "failed",
    label: "Failed",
    icon: AlertCircle,
    href: "/dashboard/finance?tab=transactions&status=failed",
    className: "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
  },
  {
    id: "pending",
    label: "Pending",
    icon: Clock,
    href: "/dashboard/finance?tab=transactions&status=pending_review",
    className: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10",
  },
];

const adminShortcuts = [
  { id: 1, label: "Fulfillment", icon: Truck, href: "/dashboard/fulfillment" },
  { id: 2, label: "Vendor Lots", icon: Package, href: "/dashboard/vendor-lots" },
  { id: 3, label: "Auctions", icon: Gavel, href: "/dashboard/auctions" },
  { id: 4, label: "Disputes", icon: ShieldAlert, href: "/dashboard/disputes" },
  { id: 5, label: "Promotions", icon: Megaphone, href: "/dashboard/promotions" },
  { id: 6, label: "Users", icon: Users, href: "/dashboard/users" },
];

export function QuickActions() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Payout Status</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {payoutShortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <Button key={s.id} variant="outline" className={`flex-1 gap-2 ${s.className}`} asChild>
                <Link href={s.href}>
                  <Icon className="size-4" />
                  {s.label}
                </Link>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Admin Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {adminShortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <Link key={s.id} href={s.href} className="flex flex-col items-center gap-2.5">
                  <div className="flex size-12 items-center justify-center rounded-full border bg-muted transition-colors hover:bg-muted/80">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <span className="text-center text-muted-foreground text-xs">{s.label}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
