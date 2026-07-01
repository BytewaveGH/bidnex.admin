import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LotPipeline } from "./overview";

interface Props {
  lotPipeline?: LotPipeline;
}

const mockStages = [
  { label: "Submitted", count: 127, color: "bg-blue-500" },
  { label: "Approved", count: 89, color: "bg-indigo-500" },
  { label: "Live", count: 63, color: "bg-emerald-500" },
  { label: "Settled", count: 51, color: "bg-primary" },
];

const stageColors = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-primary"] as const;

export function LotApprovalFunnel({ lotPipeline }: Props) {
  const stages = lotPipeline
    ? [
        { label: "Submitted", count: lotPipeline.submitted, color: stageColors[0] },
        { label: "Approved", count: lotPipeline.approved, color: stageColors[1] },
        { label: "Live", count: lotPipeline.live, color: stageColors[2] },
        { label: "Settled", count: lotPipeline.settled, color: stageColors[3] },
      ]
    : mockStages;

  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const settledAllTime = lotPipeline?.settledAllTime ?? 1284;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lot Pipeline</CardTitle>
        <CardDescription>This month&apos;s lot journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {stages.map((stage, index) => {
            const rawWidth = Math.round((stage.count / maxCount) * 100);
            const barWidth = `${Math.max(rawWidth, 8)}%`;
            const conversionText =
              index === 0 ? "" : `${((stage.count / Math.max(stages[index - 1].count, 1)) * 100).toFixed(0)}%`;

            return (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-muted-foreground text-sm">{stage.label}</span>
                <div className="flex-1">
                  <div className={cn("h-2.5 rounded-full", stage.color)} style={{ width: barWidth }} />
                </div>
                <span className="w-12 text-right font-semibold text-sm tabular-nums">
                  {stage.count.toLocaleString()}
                </span>
                <span className="w-10 text-right text-muted-foreground text-xs">{conversionText}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-muted-foreground text-xs">
          {settledAllTime.toLocaleString()} lots settled all-time across all periods.
        </p>
      </CardContent>
    </Card>
  );
}
