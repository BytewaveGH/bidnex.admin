import Link from "next/link";

import { Filter, PlusCircle, RefreshCw, Search, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

interface AuctionHeaderProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSearchCommit: () => void;
  onRefresh: () => void;
}

export function AuctionHeader({ searchInput, onSearchChange, onSearchCommit, onRefresh }: AuctionHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-medium text-2xl leading-tight tracking-tight sm:text-3xl sm:leading-none">
              Auctions Overview
            </h1>
            {/* <p className="text-muted-foreground text-sm">
              Monitor active, upcoming, and ended auctions with live bid status across all vendors.
            </p> */}
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <span className="whitespace-nowrap text-muted-foreground text-sm">Last updated: 30s ago</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" onClick={onRefresh}>
                <RefreshCw />
              </Button>
              <Button variant="outline" size="icon-sm">
                <Settings />
              </Button>
              <Button asChild>
                <Link href="/dashboard/auctions/new">
                  <PlusCircle data-icon="inline-start" />
                  New Auction
                </Link>
              </Button>
            </div>
          </div>
        </div>
        {/* <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Gavel />4 Auctions
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Layers />8 Lots
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Tag />
            14 Active Bids
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <span className="size-2 rounded-full bg-green-600 dark:bg-green-500" />
            GHS 25,350 Total Value
          </Badge>
        </div> */}
      </div>

      <div className="flex flex-col gap-3 xl:flex-row">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by product or auction..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearchCommit();
            }}
          />
          <InputGroupAddon align="inline-end">
            <Kbd>⌘ K</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <PlusCircle data-icon="inline-start" />
            Vendor
          </Button>
          <Button variant="outline">
            <PlusCircle data-icon="inline-start" />
            Category
          </Button>
          <Button variant="outline">
            <PlusCircle data-icon="inline-start" />
            Condition
          </Button>
          <Button variant="outline">
            <PlusCircle data-icon="inline-start" />
            Lot Status
          </Button>
          <Button variant="outline">
            <PlusCircle data-icon="inline-start" />
            Bid Status
          </Button>
          <Button variant="outline">
            <Filter data-icon="inline-start" />
            Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
