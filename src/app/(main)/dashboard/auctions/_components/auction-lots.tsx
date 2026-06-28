import {
  ArrowUpDown,
  Bell,
  Car,
  ChevronDown,
  CircleDashed,
  Clock3,
  Copy,
  EllipsisVertical,
  FileText,
  Gavel,
  Home,
  Laptop,
  type LucideIcon,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Shirt,
  Smartphone,
  SquareTerminal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { IAuction, IAuctionLot } from "./auction-data";

// ── Category → icon map ───────────────────────────────────────────────────────

const categoryIconMap: Record<string, LucideIcon> = {
  Electronics: Laptop,
  "Phones & Accessories": Smartphone,
  "Home/Kitchen": Home,
  "Office Products": Package,
  "Car Parts": Car,
  Clothes: Shirt,
};

function getCategoryIcon(name: string): LucideIcon {
  return categoryIconMap[name] ?? Package;
}

// ── Status helpers ────────────────────────────────────────────────────────────

function getAuctionStatus(status: string): "Active" | "Upcoming" | "Ended" {
  if (status === "ended") return "Ended";
  if (status === "active") return "Active";
  return "Upcoming";
}

function getTimeLeft(endTime: string, status: string): string {
  if (status === "ended") return "Ended";
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const totalMins = Math.floor(diff / 60000);
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function computeMetrics(lot: IAuctionLot) {
  const startingBid = Math.max(lot.startingBid, 0.01);
  const reservePrice = Math.max(lot.reservePrice, 0.01);
  return {
    aboveStart: Math.min(Math.round(((lot.currentBid - lot.startingBid) / startingBid) * 100), 100),
    reserveMet: Math.min(Math.round((lot.currentBid / reservePrice) * 100), 100),
    bidActivity: Math.min(lot.bidCount * 20, 100),
  };
}

function formatCondition(condition: string): string {
  return condition.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BidMeter({ label, value }: { label: string; value: number }) {
  const isCritical = value >= 70;
  const isWarning = value >= 45;

  return (
    <span className="min-w-0 space-y-1">
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-medium text-emerald-600 tabular-nums dark:text-emerald-400",
            isWarning && "text-amber-600 dark:text-amber-400",
            isCritical && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {value}%
        </span>
      </span>
      <span className="block h-1.5 overflow-hidden rounded-full bg-muted-foreground/20">
        <span
          className={cn(
            "block h-full rounded-full bg-muted-foreground/40",
            isWarning && "bg-amber-500",
            isCritical && "bg-emerald-500",
          )}
          style={{ width: `${value}%` }}
        />
      </span>
    </span>
  );
}

function LotsTable({ lots, auction }: { lots: IAuctionLot[]; auction: IAuction }) {
  const auctionStatus = getAuctionStatus(auction.status);
  const timeLeft = getTimeLeft(auction.endTime, auction.status);

  return (
    <div className="scrollbar-thin overflow-x-auto [scrollbar-color:var(--border)_transparent] **:data-[slot=table-container]:overflow-visible [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
      <Table className="min-w-[1700px] table-fixed **:data-[slot='table-cell']:px-5 **:data-[slot='table-head']:px-5">
        <colgroup>
          <col className="w-90" />
          <col className="w-40" />
          <col className="w-42" />
          <col className="w-35" />
          <col className="w-35" />
          <col className="w-38" />
          <col className="w-98" />
          <col className="w-55" />
          <col className="w-18" />
        </colgroup>
        <TableHeader className="bg-muted/50 [&_tr]:border-y">
          <TableRow>
            <TableHead className="font-medium">
              <span className="inline-flex items-center gap-1">
                Product <ArrowUpDown className="size-4" />
              </span>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bids</TableHead>
            <TableHead>Current Bid</TableHead>
            <TableHead>Time Left</TableHead>
            <TableHead>Metrics</TableHead>
            <TableHead>Location / Condition</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="**:data-[slot='table-row']:hover:bg-transparent">
          {lots.map((lot) => {
            const Icon = getCategoryIcon(lot.category.name);
            const bidStatus = lot.bidCount > 0 ? "Live" : "No Bids";
            const metrics = computeMetrics(lot);

            return (
              <TableRow key={lot.id}>
                <TableCell>
                  <span className="block truncate font-medium" title={lot.title}>
                    {lot.title}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <Icon className="size-4 shrink-0" />
                    {lot.category.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={auctionStatus === "Ended" ? "destructive" : "secondary"}
                    className={cn(
                      "rounded-sm px-1.5 py-0.5",
                      auctionStatus === "Active" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      auctionStatus === "Upcoming" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                    )}
                  >
                    {auctionStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={bidStatus === "Live" ? "secondary" : "destructive"}
                    className={cn(
                      "rounded-sm px-1.5 py-0.5",
                      bidStatus === "Live" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        bidStatus === "Live" ? "bg-emerald-500" : "bg-destructive",
                      )}
                    />
                    {bidStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
                    <Gavel className="size-4 text-muted-foreground" />
                    GHS {lot.currentBid.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
                    <Clock3 className="size-4" />
                    {timeLeft}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="grid grid-cols-3 gap-4">
                    <BidMeter label="Above Start" value={metrics.aboveStart} />
                    <BidMeter label="Reserve" value={metrics.reserveMet} />
                    <BidMeter label="Activity" value={metrics.bidActivity} />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="flex flex-col font-medium">
                    {auction.locationName}
                    <span className="text-muted-foreground text-xs">{formatCondition(lot.condition)}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="-mr-2">
                        <SquareTerminal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40" align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <FileText />
                          Bid History
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Gavel />
                          View Lot
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw />
                          Relist
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <Copy />
                          Copy Lot ID
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyAuctionState() {
  return (
    <div className="flex min-h-24 items-center justify-center border-t bg-muted/50 p-4">
      <div className="flex items-center gap-2">
        <CircleDashed className="size-4" />
        <p className="font-medium text-sm">No lots in this auction yet</p>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AuctionLots({ auction }: { auction: IAuction }) {
  return (
    <Collapsible
      defaultOpen
      className="flex flex-col overflow-hidden rounded-xl border bg-card py-3 text-card-foreground data-[state=open]:gap-3 data-[state=open]:pb-0"
    >
      <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="group -ml-2 h-auto w-full justify-start gap-2 px-2 py-1 hover:bg-transparent aria-expanded:bg-transparent sm:flex-1"
          >
            <ChevronDown className="group-data-[state=open]:rotate-180" />
            <div className="flex min-w-0 items-baseline gap-1.5 text-left">
              <span className="shrink-0 font-medium leading-none">{auction.title}</span>
              {auction.locationName && (
                <span className="min-w-0 truncate text-muted-foreground text-sm">({auction.locationName})</span>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          <Button variant="ghost" size="sm" className="-ml-1.5 sm:ml-0">
            <Plus data-icon="inline-start" />
            Add Lot
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="end">
              <DropdownMenuGroup>
                {auction.lots.length > 0 ? (
                  <DropdownMenuItem>
                    <FileText />
                    Bid History
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem>
                  <Gavel />
                  View Auction
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Auction Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw />
                  Sync Bids
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Manage Alerts
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Copy />
                  Copy Auction ID
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CollapsibleContent>
        {auction.lots.length > 0 ? <LotsTable lots={auction.lots} auction={auction} /> : <EmptyAuctionState />}
      </CollapsibleContent>
    </Collapsible>
  );
}
