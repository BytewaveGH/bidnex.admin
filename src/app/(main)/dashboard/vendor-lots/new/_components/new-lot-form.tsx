"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";

import { AuctionServices } from "../../../auctions/_logics/services";
import { type CreateLotBody, VendorLotServices } from "../../_logics/services";

type Mode = "standalone" | "auction";
type Condition = "new" | "used" | "refurbished";
interface SpecRow {
  key: string;
  value: string;
}

interface ApiAuction {
  id: number;
  title: string;
  status: string;
}
interface ApiAuctionsResponse {
  data?: { data?: ApiAuction[] };
}
interface ApiCreateResponse {
  data?: { id: number };
  status?: boolean;
}

const ELIGIBLE_STATUSES = new Set(["draft", "pending_review", "active"]);

export function NewLotForm() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const [vendorId, setVendorId] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("standalone");
  const [auctionId, setAuctionId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [condition, setCondition] = React.useState<Condition>("used");
  const [description, setDescription] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [pickupAvailable, setPickupAvailable] = React.useState(false);
  const [shippingAvailable, setShippingAvailable] = React.useState(false);
  const [reservePrice, setReservePrice] = React.useState("");
  const [buyNowPrice, setBuyNowPrice] = React.useState("");
  const [specs, setSpecs] = React.useState<SpecRow[]>([{ key: "", value: "" }]);

  const { data: auctionsRes } = useQuery({
    queryKey: ["admin-auctions-lot-form"],
    queryFn: () => {
      const svc = AuctionServices.FetchAll({ page: 1, limit: 100 });
      return apiRequest<ApiAuctionsResponse>(svc.endpoint, token, { params: svc.params });
    },
    enabled: sessionStatus === "authenticated" && mode === "auction",
    staleTime: 60_000,
  });

  const eligibleAuctions = (auctionsRes?.data?.data ?? []).filter((a) => ELIGIBLE_STATUSES.has(a.status.toLowerCase()));

  const createMutation = useMutation({
    mutationFn: () => {
      const body: CreateLotBody = {
        vendorId: Number(vendorId),
        title: title.trim(),
        condition,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(sku.trim() ? { sku: sku.trim() } : {}),
        pickupAvailable,
        shippingAvailable,
        ...(reservePrice ? { reservePrice: Number(reservePrice) } : {}),
        ...(buyNowPrice ? { buyNowPrice: Number(buyNowPrice) } : {}),
        ...(specs.some((s) => s.key.trim())
          ? {
              specifications: Object.fromEntries(
                specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()]),
              ),
            }
          : {}),
      };

      if (mode === "auction" && auctionId) {
        const svc = VendorLotServices.CreateLotForAuction(Number(auctionId), body);
        return apiRequest<ApiCreateResponse>(svc.endpoint, token, { method: "POST", body: svc.body });
      }

      const svc = VendorLotServices.CreateLot(body);
      return apiRequest<ApiCreateResponse>(svc.endpoint, token, { method: "POST", body: svc.body });
    },
    onSuccess: (res) => {
      const newId = res?.data?.id;
      toast.success("Lot created successfully.");
      router.push(newId ? `/dashboard/vendor-lots/${newId}` : "/dashboard/vendor-lots");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create lot.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId || Number(vendorId) <= 0) {
      toast.error("A valid Vendor ID is required.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (mode === "auction" && !auctionId) {
      toast.error("Select an auction to attach this lot to.");
      return;
    }
    createMutation.mutate();
  }

  function addSpec() {
    setSpecs((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeSpec(i: number) {
    setSpecs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSpec(i: number, field: "key" | "value", val: string) {
    setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  }

  const isPending = createMutation.isPending;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-16">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/dashboard/vendor-lots">
            <ArrowLeft data-icon="inline-start" />
            Back to Lots
          </Link>
        </Button>
        <div>
          <h1 className="font-medium text-2xl tracking-tight">Create Lot for Vendor</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Lot starts in draft — it must be approved before it goes live.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Vendor */}
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-base">Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vendorId">
                Vendor ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendorId"
                type="number"
                min={1}
                placeholder="e.g. 42"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">Find the vendor's ID from the Users page.</p>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-base">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {(["standalone", "auction"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    mode === m
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <span className="font-medium">{m === "standalone" ? "Standalone" : "Attach to Auction"}</span>
                  <p className="mt-0.5 font-normal text-muted-foreground text-xs">
                    {m === "standalone"
                      ? "Sits in the unassigned pool for later"
                      : "Created directly under a specific auction"}
                  </p>
                </button>
              ))}
            </div>

            {mode === "auction" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auctionId">
                  Auction <span className="text-destructive">*</span>
                </Label>
                <Select value={auctionId} onValueChange={setAuctionId}>
                  <SelectTrigger id="auctionId">
                    <SelectValue placeholder="Select an auction…" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleAuctions.length === 0 && (
                      <SelectItem value="__none" disabled>
                        No eligible auctions found
                      </SelectItem>
                    )}
                    {eligibleAuctions.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.title}
                        <span className="ml-1 text-muted-foreground text-xs capitalize">({a.status})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lot Details */}
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-base">Lot Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Vintage Rolex Submariner 1966"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="condition">
                  Condition <span className="text-destructive">*</span>
                </Label>
                <Select value={condition} onValueChange={(v) => setCondition(v as Condition)}>
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sku">SKU / Reference No</Label>
                <Input id="sku" placeholder="e.g. WATCH-001" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the item condition, history, inclusions…"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Availability</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="pickup" checked={pickupAvailable} onCheckedChange={(c) => setPickupAvailable(!!c)} />
                <Label htmlFor="pickup" className="cursor-pointer font-normal">
                  Pickup available
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="shipping"
                  checked={shippingAvailable}
                  onCheckedChange={(c) => setShippingAvailable(!!c)}
                />
                <Label htmlFor="shipping" className="cursor-pointer font-normal">
                  Shipping available
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reservePrice">Reserve Price</Label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-muted-foreground text-sm">
                  GHS
                </span>
                <Input
                  id="reservePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  className="rounded-l-none"
                />
              </div>
              <p className="text-muted-foreground text-xs">Not shown to bidders.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="buyNowPrice">Buy Now Price</Label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-muted-foreground text-sm">
                  GHS
                </span>
                <Input
                  id="buyNowPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={buyNowPrice}
                  onChange={(e) => setBuyNowPrice(e.target.value)}
                  className="rounded-l-none"
                />
              </div>
              <p className="text-muted-foreground text-xs">Optional instant-purchase price.</p>
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-base">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {specs.map((spec, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: specification rows are positional
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Key (e.g. Brand)"
                  value={spec.key}
                  onChange={(e) => updateSpec(i, "key", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value (e.g. Rolex)"
                  value={spec.value}
                  onChange={(e) => updateSpec(i, "value", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeSpec(i)}
                  disabled={specs.length === 1}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Minus className="size-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addSpec} className="w-fit">
              <Plus className="size-4" />
              Add specification
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/vendor-lots">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create Lot"}
          </Button>
        </div>
      </form>
    </div>
  );
}
