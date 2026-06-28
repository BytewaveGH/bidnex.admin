import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

interface Props {
  total: number;
  topLevel: number;
  subcategories: number;
}

export function CategoryKpiCards({ total, topLevel, subcategories }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Total Categories</CardDescription>
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
          <CardDescription>Top-Level</CardDescription>
          <CardAction>
            <ArrowUpRight className="size-4" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <span className="text-3xl leading-none tracking-tight">{topLevel}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Subcategories</CardDescription>
          <CardAction>
            <ArrowUpRight className="size-4" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <span className="text-3xl leading-none tracking-tight">{subcategories}</span>
        </CardContent>
      </Card>
    </div>
  );
}
