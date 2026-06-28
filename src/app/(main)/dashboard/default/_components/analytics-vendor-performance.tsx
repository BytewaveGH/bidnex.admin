import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const vendors = [
  {
    name: "Accra Luxury Traders",
    submitted: 58,
    approvalRate: 91,
    avgFinalPrice: 4464,
    totalRevenue: 187500,
    status: "active",
  },
  {
    name: "TechHub Ghana Ltd.",
    submitted: 82,
    approvalRate: 88,
    avgFinalPrice: 2124,
    totalRevenue: 142300,
    status: "active",
  },
  {
    name: "Abena Gold & Jewels",
    submitted: 34,
    approvalRate: 85,
    avgFinalPrice: 3403,
    totalRevenue: 98700,
    status: "active",
  },
  {
    name: "Dansoman Electronics",
    submitted: 64,
    approvalRate: 80,
    avgFinalPrice: 1494,
    totalRevenue: 76200,
    status: "active",
  },
  {
    name: "Kofi Mensah Supplies",
    submitted: 47,
    approvalRate: 81,
    avgFinalPrice: 1424,
    totalRevenue: 54100,
    status: "active",
  },
  {
    name: "Kumasi Auto Parts",
    submitted: 29,
    approvalRate: 72,
    avgFinalPrice: 2180,
    totalRevenue: 41420,
    status: "active",
  },
  {
    name: "GoldCoast Antiques",
    submitted: 22,
    approvalRate: 77,
    avgFinalPrice: 3150,
    totalRevenue: 37800,
    status: "active",
  },
  {
    name: "Tema Port Traders",
    submitted: 41,
    approvalRate: 63,
    avgFinalPrice: 980,
    totalRevenue: 25380,
    status: "warning",
  },
  {
    name: "SilverStar Collectibles",
    submitted: 18,
    approvalRate: 56,
    avgFinalPrice: 1640,
    totalRevenue: 18040,
    status: "warning",
  },
  {
    name: "Cape Coast Crafts",
    submitted: 12,
    approvalRate: 42,
    avgFinalPrice: 720,
    totalRevenue: 6480,
    status: "inactive",
  },
];

function getApprovalRateClass(rate: number): string {
  if (rate >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="h-4 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-400"
      >
        Active
      </Badge>
    );
  }
  if (status === "warning") {
    return (
      <Badge
        variant="outline"
        className="h-4 border-amber-500/30 bg-amber-500/10 px-1.5 text-[10px] text-amber-700 dark:text-amber-400"
      >
        Warning
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="h-4 px-1.5 text-[10px] text-muted-foreground">
      Inactive
    </Badge>
  );
}

export function AnalyticsVendorPerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Performance</CardTitle>
        <CardDescription>All vendors — current period</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Vendor</TableHead>
              <TableHead className="text-xs">Lots Submitted</TableHead>
              <TableHead className="text-xs">Approval Rate</TableHead>
              <TableHead className="text-xs">Avg Final Price</TableHead>
              <TableHead className="text-xs">Total Revenue</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.name}>
                <TableCell className="font-medium text-sm">{vendor.name}</TableCell>
                <TableCell className="text-sm tabular-nums">{vendor.submitted}</TableCell>
                <TableCell className={`font-medium text-sm tabular-nums ${getApprovalRateClass(vendor.approvalRate)}`}>
                  {vendor.approvalRate}%
                </TableCell>
                <TableCell className="text-sm tabular-nums">GHS {vendor.avgFinalPrice.toLocaleString()}</TableCell>
                <TableCell className="font-medium text-sm tabular-nums">
                  GHS {vendor.totalRevenue.toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={vendor.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
