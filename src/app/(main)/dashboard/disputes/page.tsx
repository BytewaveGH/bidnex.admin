import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import { disputes } from "./_components/data";
import { Disputes } from "./_components/disputes";

export default function Page() {
  const total = disputes.length;
  const open = disputes.filter((d) => d.status === "open").length;
  const highPriority = disputes.filter((d) => d.priority === "high").length;
  const resolved = disputes.filter((d) => d.status === "resolved").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl tracking-tight">Disputes</h2>
        <p className="text-muted-foreground">Review and manage open disputes across all auctions.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Disputes</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <span className="text-3xl leading-none tracking-tight">{total}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <span className="text-3xl leading-none tracking-tight">{open}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>High Priority</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <span className="text-3xl leading-none tracking-tight">{highPriority}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Resolved</CardDescription>
            <CardAction>
              <ArrowUpRight className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <span className="text-3xl leading-none tracking-tight">{resolved}</span>
          </CardContent>
        </Card>
      </div>

      <Disputes data={disputes} />
    </div>
  );
}
