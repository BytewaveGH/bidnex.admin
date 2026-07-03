"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { Check, GripVertical, Search, Star, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import type { VendorLot } from "../../../vendor-lots/_components/vendor-lots-data";
import { VendorLotServices } from "../../../vendor-lots/_logics/services";
import { AuctionServices } from "../../_logics/services";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfiguredLot {
  lot: VendorLot;
  featured: boolean;
  featuredPending?: boolean;
}

interface AuctionForm {
  name: string;
  description: string;
  startDate: string;
  startTime: string;
  lotIntervalMinutes: string;
  location: string;
  address: string;
}

interface UnassignedLotsResponse {
  data: {
    count: number;
    page: number;
    limit: number;
    data: VendorLot[];
  };
  status: boolean;
}

const LOTS_PER_PAGE = 10;

const STEPS = ["Details", "Add Lots", "Review"];

function stepCircleClass(i: number, current: number) {
  if (i < current) return "bg-emerald-600 text-white";
  if (i === current) return "bg-primary text-primary-foreground";
  return "border bg-muted text-muted-foreground";
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full font-semibold text-xs transition-colors",
                stepCircleClass(i, current),
              )}
            >
              {i < current ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:block",
                i === current ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("mx-3 h-px flex-1 transition-colors", i < current ? "bg-emerald-600" : "bg-border")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Step 1: Auction Details ─────────────────────────────────────────────────

function DetailsStep({
  form,
  errors,
  onChange,
}: {
  form: AuctionForm;
  errors: Partial<AuctionForm>;
  onChange: (field: keyof AuctionForm, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base leading-none">Auction Info</CardTitle>
            <CardDescription>The name and description will be visible to all bidders.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">
                Auction Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Premium Timepieces — June 2026"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what bidders can expect in this auction..."
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                className="min-h-28 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base leading-none">Location</CardTitle>
            <CardDescription>Where the auction will be held.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">
                Venue Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g. Accra Auction House"
                value={form.location}
                onChange={(e) => onChange("location", e.target.value)}
                className={cn(errors.location && "border-destructive")}
              />
              {errors.location && <p className="text-destructive text-xs">{errors.location}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g. 14 Liberation Road, Airport Residential Area"
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base leading-none">Schedule</CardTitle>
            <CardDescription>Set when this auction starts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => onChange("startDate", e.target.value)}
                className={cn(errors.startDate && "border-destructive")}
              />
              {errors.startDate && <p className="text-destructive text-xs">{errors.startDate}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime">
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => onChange("startTime", e.target.value)}
                className={cn(errors.startTime && "border-destructive")}
              />
              {errors.startTime && <p className="text-destructive text-xs">{errors.startTime}</p>}
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lotIntervalMinutes">
                Minutes per Lot <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lotIntervalMinutes"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 15"
                value={form.lotIntervalMinutes}
                onChange={(e) => onChange("lotIntervalMinutes", e.target.value)}
                className={cn(errors.lotIntervalMinutes && "border-destructive")}
              />
              {errors.lotIntervalMinutes ? (
                <p className="text-destructive text-xs">{errors.lotIntervalMinutes}</p>
              ) : (
                <p className="text-muted-foreground text-xs">Each lot gets this many minutes in the bidding window.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Step 2: Add Lots ────────────────────────────────────────────────────────

function LotsStep({
  configuredLots,
  lotIntervalMinutes,
  errors,
  onAdd,
  onRemove,
  onFeaturedChange,
}: {
  configuredLots: ConfiguredLot[];
  lotIntervalMinutes: string;
  errors: { lots?: string };
  onAdd: (lot: VendorLot) => void;
  onRemove: (id: number) => void;
  onFeaturedChange: (id: number, value: boolean) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  const svc = VendorLotServices.FetchUnassigned({ page, limit: LOTS_PER_PAGE });
  const {
    data: res,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["unassigned-lots", page],
    queryFn: () => apiRequest<UnassignedLotsResponse>(svc.endpoint, token, { params: svc.params }),
    enabled: sessionStatus === "authenticated",
    staleTime: 30_000,
  });

  const apiLots = res?.data?.data ?? [];
  const totalCount = res?.data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / LOTS_PER_PAGE);

  const addedIds = new Set(configuredLots.map((cl) => cl.lot.id));
  const available = apiLots.filter(
    (l) =>
      !addedIds.has(l.id) &&
      (!search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.category.name.toLowerCase().includes(search.toLowerCase())),
  );

  let lotsListContent: React.ReactElement;
  if (isLoading) {
    lotsListContent = (
      <div className="divide-y border-t">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
          <div key={i} className="flex items-center gap-3 px-6 py-3">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-7 w-12 rounded-md" />
          </div>
        ))}
      </div>
    );
  } else if (isError) {
    lotsListContent = (
      <div className="flex h-32 items-center justify-center text-destructive text-sm">
        Failed to load lots. Please try again.
      </div>
    );
  } else if (available.length === 0) {
    lotsListContent = (
      <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
        {totalCount === 0 ? "No unassigned lots available." : "All lots on this page added or no matches."}
      </div>
    );
  } else {
    lotsListContent = (
      <div className="divide-y border-t">
        {available.map((lot) => (
          <div key={lot.id} className="flex items-center gap-3 px-6 py-3">
            {/* biome-ignore lint/performance/noImgElement: lot thumbnail */}
            <img src={lot.primaryImage} alt="" className="size-10 shrink-0 rounded-md border object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm" title={lot.title}>
                {lot.title}
              </p>
              <p className="text-muted-foreground text-xs">
                {lot.category.name} · GHS {lot.startingBid.toFixed(2)}
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => onAdd(lot)}>
              Add
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      {/* Available lots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-none">Approved Lots</CardTitle>
          <CardDescription>Select lots to include in this auction.</CardDescription>
          <CardAction>
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-7 w-48 pl-8"
                placeholder="Search lots..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {lotsListContent}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3">
              <span className="text-muted-foreground text-xs">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auction queue */}
      <div className="flex flex-col gap-2">
        <Card className={cn(errors.lots && "border-destructive")}>
          <CardHeader>
            <CardTitle className="text-base leading-none">Auction Lots</CardTitle>
            <CardDescription>
              Mark lots as featured. Duration is {lotIntervalMinutes || "—"} min/lot from Step 1.
            </CardDescription>
            <CardAction>
              {configuredLots.length > 0 && (
                <Badge variant="secondary">
                  {configuredLots.length} lot{configuredLots.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {configuredLots.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
                <p className="text-muted-foreground text-sm">No lots added yet.</p>
                <p className="text-muted-foreground text-xs">Click "Add" on a lot to include it.</p>
              </div>
            ) : (
              <div className="divide-y border-t">
                {configuredLots.map((cl) => (
                  <div key={cl.lot.id} className="flex flex-col gap-3 px-6 py-4">
                    {/* Lot title row */}
                    <div className="flex items-center gap-3">
                      <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                      {/* biome-ignore lint/performance/noImgElement: lot thumbnail */}
                      <img
                        src={cl.lot.primaryImage}
                        alt=""
                        className="size-9 shrink-0 rounded-md border object-cover"
                      />
                      <p className="min-w-0 flex-1 truncate font-medium text-sm" title={cl.lot.title}>
                        {cl.lot.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        onClick={() => onRemove(cl.lot.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/* Config row */}
                    <div className="ml-7 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Star
                          className={cn(
                            "size-3.5 shrink-0",
                            cl.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
                          )}
                        />
                        <Label className="text-muted-foreground text-xs">Featured</Label>
                        <Switch
                          size="sm"
                          checked={cl.featured}
                          disabled={cl.featuredPending}
                          onCheckedChange={(v) => onFeaturedChange(cl.lot.id, v)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {errors.lots && <p className="px-1 text-destructive text-xs">{errors.lots}</p>}

        {configuredLots.length > 0 && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-muted-foreground text-xs">
              Estimated total duration:{" "}
              <span className="font-medium text-foreground">
                {configuredLots.length * (parseInt(lotIntervalMinutes, 10) || 0)} minutes
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Review ──────────────────────────────────────────────────────────

function ReviewStep({ form, configuredLots }: { form: AuctionForm; configuredLots: ConfiguredLot[] }) {
  const intervalMinutes = parseInt(form.lotIntervalMinutes, 10) || 0;
  const totalMinutes = configuredLots.length * intervalMinutes;
  const featuredCount = configuredLots.filter((cl) => cl.featured).length;

  function formatDateTime() {
    if (!form.startDate || !form.startTime) return "—";
    const [y, m, d] = form.startDate.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [h, min] = form.startTime.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y} at ${hour12}:${min} ${ampm}`;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Auction summary */}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base leading-none">Auction Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 px-0">
            <div className="divide-y border-t">
              <div className="grid grid-cols-[140px_1fr] gap-4 px-6 py-3">
                <span className="text-muted-foreground text-sm">Name</span>
                <span className="font-medium text-sm">{form.name || "—"}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 px-6 py-3">
                <span className="text-muted-foreground text-sm">Starts</span>
                <span className="font-medium text-sm">{formatDateTime()}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 px-6 py-3">
                <span className="text-muted-foreground text-sm">Venue</span>
                <span className="font-medium text-sm">{form.location || "—"}</span>
              </div>
              {form.address && (
                <div className="grid grid-cols-[140px_1fr] gap-4 px-6 py-3">
                  <span className="text-muted-foreground text-sm">Address</span>
                  <span className="font-medium text-sm">{form.address}</span>
                </div>
              )}
              <div className="grid grid-cols-[140px_1fr] gap-4 px-6 py-3">
                <span className="text-muted-foreground text-sm">Total Lots</span>
                <span className="font-medium text-sm">{configuredLots.length}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-4 px-6 py-3">
                <span className="text-muted-foreground text-sm">Est. Duration</span>
                <span className="font-medium text-sm">{totalMinutes} minutes</span>
              </div>
              {featuredCount > 0 && (
                <div className="grid grid-cols-[140px_1fr] gap-4 px-6 py-3">
                  <span className="text-muted-foreground text-sm">Featured</span>
                  <span className="font-medium text-sm">
                    {featuredCount} lot{featuredCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {form.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{form.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lots summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-none">Lots</CardTitle>
          <CardDescription>In order of auction.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y border-t">
            {configuredLots.map((cl, i) => (
              <div key={cl.lot.id} className="flex items-center gap-3 px-6 py-3">
                <span className="w-5 shrink-0 text-center text-muted-foreground text-xs">{i + 1}</span>
                {/* biome-ignore lint/performance/noImgElement: lot thumbnail */}
                <img src={cl.lot.primaryImage} alt="" className="size-9 shrink-0 rounded-md border object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{cl.lot.title}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">{form.lotIntervalMinutes || "—"} min</span>
                    {cl.featured && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="flex items-center gap-0.5 text-amber-600 text-xs">
                          <Star className="size-3 fill-amber-400 text-amber-400" /> Featured
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Form ───────────────────────────────────────────────────────────────

export function NewAuctionForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<AuctionForm>({
    name: "",
    description: "",
    startDate: "",
    startTime: "",
    lotIntervalMinutes: "15",
    location: "",
    address: "",
  });
  const [configuredLots, setConfiguredLots] = React.useState<ConfiguredLot[]>([]);
  const [errors, setErrors] = React.useState<Partial<AuctionForm> & { lots?: string }>({});
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  function handleFormChange(field: keyof AuctionForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep1() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Auction name is required.";
    if (!form.startDate) e.startDate = "Start date is required.";
    if (!form.startTime) e.startTime = "Start time is required.";
    const interval = parseInt(form.lotIntervalMinutes, 10);
    if (!form.lotIntervalMinutes || Number.isNaN(interval) || interval < 1)
      e.lotIntervalMinutes = "Enter a valid interval (min 1).";
    if (!form.location.trim()) e.location = "Venue name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    if (configuredLots.length === 0) {
      setErrors({ lots: "Add at least one lot to the auction." });
      return false;
    }
    setErrors({});
    return true;
  }

  function handleNext() {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !validateStep2()) return;
    setErrors({});
    setStep((s) => s + 1);
  }

  function handleAddLot(lot: VendorLot) {
    setConfiguredLots((prev) => [...prev, { lot, featured: false }]);
    if (errors.lots) setErrors((prev) => ({ ...prev, lots: undefined }));
  }

  function handleRemoveLot(id: number) {
    setConfiguredLots((prev) => prev.filter((cl) => cl.lot.id !== id));
  }

  async function handleFeaturedChange(id: number, value: boolean) {
    setConfiguredLots((prev) =>
      prev.map((cl) => (cl.lot.id === id ? { ...cl, featured: value, featuredPending: true } : cl)),
    );
    try {
      const featureSvc = VendorLotServices.FeatureLot(id, value);
      await apiRequest(featureSvc.endpoint, token, { method: "PUT", body: featureSvc.body });
    } catch (err) {
      setConfiguredLots((prev) => prev.map((cl) => (cl.lot.id === id ? { ...cl, featured: !value } : cl)));
      toast.error(err instanceof Error ? err.message : "Failed to update featured status.");
    } finally {
      setConfiguredLots((prev) => prev.map((cl) => (cl.lot.id === id ? { ...cl, featuredPending: false } : cl)));
    }
  }

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    try {
      const startTime = `${form.startDate}T${form.startTime}:00Z`;
      const totalMinutes = configuredLots.length * parseInt(form.lotIntervalMinutes, 10);
      const endTime = new Date(new Date(startTime).getTime() + totalMinutes * 60_000).toISOString();
      const createSvc = AuctionServices.CreateAuction({
        title: form.name.trim(),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        startTime,
        endTime,
        locationName: form.location.trim(),
        ...(form.address.trim() ? { locationAddress: form.address.trim() } : {}),
      });
      const res = await apiRequest<{ data: { id: number }; status: boolean }>(createSvc.endpoint, token, {
        method: "POST",
        body: createSvc.body,
      });
      const auctionId = res.data.id;

      const lotResults = await Promise.allSettled(
        configuredLots.map((cl, i) => {
          const assignSvc = AuctionServices.AssignLot(auctionId, cl.lot.id, {
            lotInterval: parseInt(form.lotIntervalMinutes, 10),
            lotOrder: i + 1,
          });
          return apiRequest(assignSvc.endpoint, token, { method: "POST", body: assignSvc.body });
        }),
      );

      const failedLots = lotResults
        .map((result, i) => ({ result, lot: configuredLots[i].lot }))
        .filter(
          (entry): entry is { result: PromiseRejectedResult; lot: VendorLot } => entry.result.status === "rejected",
        );

      if (failedLots.length > 0) {
        const names = failedLots.map((f) => f.lot.title).join(", ");
        throw new Error(`Auction created, but failed to add ${failedLots.length} lot(s): ${names}`);
      }

      const scheduleSvc = AuctionServices.ScheduleAuction(auctionId, {
        startTime,
        lotIntervalMinutes: parseInt(form.lotIntervalMinutes, 10),
      });
      await apiRequest(scheduleSvc.endpoint, token, { method: "PUT", body: scheduleSvc.body });

      router.push("/dashboard/auctions");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create auction. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page heading */}
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">New Auction</h1>
        <p className="text-muted-foreground text-sm">Set up a new live auction and add approved lots.</p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      <Separator />

      {/* Step content */}
      {step === 0 && <DetailsStep form={form} errors={errors} onChange={handleFormChange} />}
      {step === 1 && (
        <LotsStep
          configuredLots={configuredLots}
          lotIntervalMinutes={form.lotIntervalMinutes}
          errors={errors}
          onAdd={handleAddLot}
          onRemove={handleRemoveLot}
          onFeaturedChange={handleFeaturedChange}
        />
      )}
      {step === 2 && <ReviewStep form={form} configuredLots={configuredLots} />}

      {/* Footer nav */}
      <Separator />
      {createError && <p className="text-destructive text-sm">{createError}</p>}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={creating}
          onClick={step === 0 ? () => router.push("/dashboard/auctions") : () => setStep((s) => s - 1)}
        >
          {step === 0 ? "Cancel" : "Back"}
        </Button>

        {step < 2 ? (
          <Button onClick={handleNext}>Next Step</Button>
        ) : (
          <Button
            className="bg-emerald-600 px-8 text-white hover:bg-emerald-700"
            disabled={creating}
            onClick={handleCreate}
          >
            <Check className="size-4" />
            {creating ? "Creating…" : "Create Auction"}
          </Button>
        )}
      </div>
    </div>
  );
}
