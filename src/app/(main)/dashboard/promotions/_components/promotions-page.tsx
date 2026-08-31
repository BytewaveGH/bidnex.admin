"use client";
"use no memo";

import * as React from "react";

import { useMutation } from "@tanstack/react-query";
import { ImageIcon, Mail, Megaphone, Minus, Plus, Send, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";

import {
  type BroadcastPayload,
  type PromotionalBroadcastPayload,
  type PromotionChannel,
  PromotionServices,
  type PromotionTarget,
  type SendToUserPayload,
  type SendToUserPromotionalPayload,
} from "../_logics/services";

// ── helpers ───────────────────────────────────────────────────────────────────

const GHANA_PHONE = /^(0\d{9}|\+233\d{9})$/;

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return null;
  return GHANA_PHONE.test(phone.trim()) ? null : "Enter a valid Ghana number (0XXXXXXXXX or +233XXXXXXXXX)";
}

interface FieldError {
  subject?: string;
  message?: string;
  email?: string;
  phone?: string;
}

type TemplateType = "custom" | "promotional";

interface GridItem {
  image: string;
  title: string;
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 font-medium text-muted-foreground text-xs uppercase tracking-wider">{children}</span>
      <Separator className="flex-1" />
    </div>
  );
}

// ── Image URL field ───────────────────────────────────────────────────────────

function ImageUrlField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
          {value ? (
            // biome-ignore lint/performance/noImgElement: user-provided CDN URL preview
            <img src={value} alt="" className="size-full rounded-md object-cover" />
          ) : (
            <ImageIcon className="size-4" />
          )}
        </span>
        <Input
          id={id}
          type="url"
          placeholder={placeholder ?? "https://cdn.example.com/image.jpg"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );
}

// ── Broadcast tab ─────────────────────────────────────────────────────────────

function BroadcastTab({ token }: { token: string | undefined }) {
  const [template, setTemplate] = React.useState<TemplateType>("custom");

  // shared fields
  const [subject, setSubject] = React.useState("");
  const [channel, setChannel] = React.useState<PromotionChannel>("email");
  const [target, setTarget] = React.useState<PromotionTarget>("all");

  // custom-only
  const [message, setMessage] = React.useState("");

  // promotional fields
  const [heroImage, setHeroImage] = React.useState("");
  const [heroCTA, setHeroCTA] = React.useState("");
  const [bodyTitle, setBodyTitle] = React.useState("");
  const [bodyText, setBodyText] = React.useState("");
  const [bodyCta, setBodyCta] = React.useState("");
  const [bodyCtaUrl, setBodyCtaUrl] = React.useState("");
  const [gridTitle, setGridTitle] = React.useState("");
  const [items, setItems] = React.useState<GridItem[]>([{ image: "", title: "" }]);
  const [featuredImage, setFeaturedImage] = React.useState("");
  const [featuredTitle, setFeaturedTitle] = React.useState("");
  const [featuredBody, setFeaturedBody] = React.useState("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldError>({});
  const [apiError, setApiError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: BroadcastPayload | PromotionalBroadcastPayload) => {
      const svc = PromotionServices.Broadcast();
      return apiRequest<{ message?: string; error?: string }>(svc.endpoint, token, {
        method: svc.method,
        body: payload,
      });
    },
    onSuccess: () => {
      toast.success("Broadcast queued successfully.");
      setSubject("");
      setMessage("");
      setChannel("email");
      setTarget("all");
      setHeroImage("");
      setHeroCTA("");
      setBodyTitle("");
      setBodyText("");
      setBodyCta("");
      setBodyCtaUrl("");
      setGridTitle("");
      setItems([{ image: "", title: "" }]);
      setFeaturedImage("");
      setFeaturedTitle("");
      setFeaturedBody("");
      setApiError(null);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : null;
      try {
        const parsed = msg ? JSON.parse(msg) : null;
        if (parsed?.error) {
          setApiError(parsed.error);
          return;
        }
      } catch {
        // not JSON
      }
      toast.error("Something went wrong, please try again.");
    },
  });

  function validate(): boolean {
    const next: FieldError = {};
    if (!subject.trim()) next.subject = "Subject is required.";
    if (template === "custom" && !message.trim()) next.message = "Message is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmitClick() {
    setApiError(null);
    if (!validate()) return;
    setConfirmOpen(true);
  }

  function handleConfirm() {
    setConfirmOpen(false);
    if (template === "custom") {
      mutation.mutate({ subject: subject.trim(), message: message.trim(), channel, target });
    } else {
      const filledItems = items.filter((i) => i.title.trim() || i.image.trim());
      const payload: PromotionalBroadcastPayload = {
        subject: subject.trim(),
        channel,
        target,
        ...(heroImage.trim() ? { heroImage: heroImage.trim() } : {}),
        ...(heroCTA.trim() ? { heroCTA: heroCTA.trim() } : {}),
        ...(bodyTitle.trim() ? { bodyTitle: bodyTitle.trim() } : {}),
        ...(bodyText.trim() ? { bodyText: bodyText.trim() } : {}),
        ...(bodyCta.trim() ? { bodyCta: bodyCta.trim() } : {}),
        ...(bodyCtaUrl.trim() ? { bodyCtaUrl: bodyCtaUrl.trim() } : {}),
        ...(gridTitle.trim() ? { gridTitle: gridTitle.trim() } : {}),
        ...(filledItems.length > 0
          ? { items: filledItems.map((i) => ({ image: i.image.trim(), title: i.title.trim() })) }
          : {}),
        ...(featuredImage.trim() ? { featuredImage: featuredImage.trim() } : {}),
        ...(featuredTitle.trim() ? { featuredTitle: featuredTitle.trim() } : {}),
        ...(featuredBody.trim() ? { featuredBody: featuredBody.trim() } : {}),
      };
      mutation.mutate(payload);
    }
  }

  function addItem() {
    if (items.length < 4) setItems((prev) => [...prev, { image: "", title: "" }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof GridItem, val: string) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  }

  const targetLabels: Record<PromotionTarget, string> = {
    all: "All Users",
    bidders: "Bidders Only",
    vendors: "Vendors Only",
  };

  const channelLabels: Record<PromotionChannel, string> = { email: "email", sms: "SMS", both: "email and SMS" };
  const deliveryLabel = template === "promotional" ? "promotional email" : channelLabels[channel];

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Template picker */}
        <div className="flex flex-col gap-1.5">
          <Label>Template</Label>
          <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
            {(["custom", "promotional"] as TemplateType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemplate(t)}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  template === t
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <span className="font-medium capitalize">{t}</span>
                <p className="mt-0.5 font-normal text-muted-foreground text-xs">
                  {t === "custom" ? "Plain subject + message" : "Rich email with images"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Subject */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bc-subject">
            Subject <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bc-subject"
            placeholder="e.g. Your next win awaits! 🔥"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
            }}
            aria-invalid={!!errors.subject}
          />
          {errors.subject && <p className="text-destructive text-xs">{errors.subject}</p>}
        </div>

        {/* Channel + Audience row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as PromotionChannel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="both">Email + SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Audience</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as PromotionTarget)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(targetLabels) as PromotionTarget[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {targetLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom template fields */}
        {template === "custom" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bc-message">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bc-message"
              placeholder="Write your promotional message here…"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
              }}
              className="min-h-36 resize-none"
              aria-invalid={!!errors.message}
            />
            {errors.message && <p className="text-destructive text-xs">{errors.message}</p>}
          </div>
        )}

        {/* Promotional template fields */}
        {template === "promotional" && (
          <div className="flex flex-col gap-6">
            {/* Hero */}
            <div className="flex flex-col gap-4">
              <SectionHeading>Hero</SectionHeading>
              <ImageUrlField
                id="bc-heroImage"
                label="Hero Image URL"
                value={heroImage}
                onChange={setHeroImage}
                placeholder="https://cdn.bidchale.com/promo/hero.jpg"
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bc-heroCTA">Hero CTA Text</Label>
                <Input
                  id="bc-heroCTA"
                  placeholder="e.g. See For Yourself"
                  value={heroCTA}
                  onChange={(e) => setHeroCTA(e.target.value)}
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4">
              <SectionHeading>Body</SectionHeading>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bc-bodyTitle">Title</Label>
                <Input
                  id="bc-bodyTitle"
                  placeholder="e.g. Your Next Win Awaits"
                  value={bodyTitle}
                  onChange={(e) => setBodyTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bc-bodyText">Body Text</Label>
                <Textarea
                  id="bc-bodyText"
                  placeholder="e.g. These hand-picked auctions are waiting for your bid!"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="min-h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bc-bodyCta">CTA Button Label</Label>
                  <Input
                    id="bc-bodyCta"
                    placeholder="e.g. Start Winning"
                    value={bodyCta}
                    onChange={(e) => setBodyCta(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bc-bodyCtaUrl">CTA URL</Label>
                  <Input
                    id="bc-bodyCtaUrl"
                    type="url"
                    placeholder="https://www.bidchale.com/auctions"
                    value={bodyCtaUrl}
                    onChange={(e) => setBodyCtaUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex flex-col gap-4">
              <SectionHeading>Grid Items</SectionHeading>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bc-gridTitle">Grid Title</Label>
                <Input
                  id="bc-gridTitle"
                  placeholder="e.g. Top Weekend Wins"
                  value={gridTitle}
                  onChange={(e) => setGridTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional grid items
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
                      {item.image ? (
                        // biome-ignore lint/performance/noImgElement: user-provided CDN URL preview
                        <img src={item.image} alt="" className="size-full object-cover" />
                      ) : (
                        <ImageIcon className="size-4" />
                      )}
                    </div>
                    <Input
                      placeholder="Image URL"
                      value={item.image}
                      onChange={(e) => updateItem(i, "image", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Title"
                      value={item.title}
                      onChange={(e) => updateItem(i, "title", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Minus className="size-4" />
                    </Button>
                  </div>
                ))}
                {items.length < 4 && (
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-fit">
                    <Plus className="size-4" />
                    Add item
                  </Button>
                )}
                <p className="text-muted-foreground text-xs">Up to 4 items. Each needs an image URL and a title.</p>
              </div>
            </div>

            {/* Featured */}
            <div className="flex flex-col gap-4">
              <SectionHeading>Featured Block</SectionHeading>
              <ImageUrlField
                id="bc-featuredImage"
                label="Featured Image URL"
                value={featuredImage}
                onChange={setFeaturedImage}
                placeholder="https://cdn.bidchale.com/promo/labour-day.jpg"
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bc-featuredTitle">Featured Title</Label>
                <Input
                  id="bc-featuredTitle"
                  placeholder="e.g. Holiday Hours"
                  value={featuredTitle}
                  onChange={(e) => setFeaturedTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bc-featuredBody">Featured Body</Label>
                <Textarea
                  id="bc-featuredBody"
                  placeholder="e.g. Labour Day is next week! BidChale auctions will continue running."
                  value={featuredBody}
                  onChange={(e) => setFeaturedBody(e.target.value)}
                  className="min-h-20 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Inline API error */}
        {apiError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5">
            <p className="text-destructive text-sm">{apiError}</p>
          </div>
        )}

        <Button className="self-end" disabled={mutation.isPending} onClick={handleSubmitClick}>
          <Megaphone className="size-4" />
          {mutation.isPending ? "Sending…" : "Send Broadcast"}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send broadcast to {targetLabels[target].toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a {deliveryLabel} to all matching active accounts. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Send Broadcast</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Send to User tab ──────────────────────────────────────────────────────────

function SendToUserTab({ token }: { token: string | undefined }) {
  const [template, setTemplate] = React.useState<TemplateType>("custom");

  // shared
  const [subject, setSubject] = React.useState("");
  const [channel, setChannel] = React.useState<PromotionChannel>("email");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  // custom-only
  const [message, setMessage] = React.useState("");

  // promotional fields
  const [heroImage, setHeroImage] = React.useState("");
  const [heroCTA, setHeroCTA] = React.useState("");
  const [bodyTitle, setBodyTitle] = React.useState("");
  const [bodyText, setBodyText] = React.useState("");
  const [bodyCta, setBodyCta] = React.useState("");
  const [bodyCtaUrl, setBodyCtaUrl] = React.useState("");
  const [gridTitle, setGridTitle] = React.useState("");
  const [items, setItems] = React.useState<GridItem[]>([{ image: "", title: "" }]);
  const [featuredImage, setFeaturedImage] = React.useState("");
  const [featuredTitle, setFeaturedTitle] = React.useState("");
  const [featuredBody, setFeaturedBody] = React.useState("");

  const [errors, setErrors] = React.useState<FieldError>({});
  const [apiError, setApiError] = React.useState<string | null>(null);

  const needsEmail = channel === "email" || channel === "both";
  const needsPhone = channel === "sms" || channel === "both";

  const mutation = useMutation({
    mutationFn: async (payload: SendToUserPayload | SendToUserPromotionalPayload) => {
      const svc = PromotionServices.SendToUser();
      return apiRequest<{ message?: string; error?: string }>(svc.endpoint, token, {
        method: svc.method,
        body: payload,
      });
    },
    onSuccess: () => {
      toast.success("Message sent.");
      setSubject("");
      setMessage("");
      setChannel("email");
      setEmail("");
      setPhone("");
      setHeroImage("");
      setHeroCTA("");
      setBodyTitle("");
      setBodyText("");
      setBodyCta("");
      setBodyCtaUrl("");
      setGridTitle("");
      setItems([{ image: "", title: "" }]);
      setFeaturedImage("");
      setFeaturedTitle("");
      setFeaturedBody("");
      setApiError(null);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : null;
      try {
        const parsed = msg ? JSON.parse(msg) : null;
        if (parsed?.error) {
          setApiError(parsed.error);
          return;
        }
      } catch {
        // not JSON
      }
      toast.error("Something went wrong, please try again.");
    },
  });

  function validate(): boolean {
    const next: FieldError = {};
    if (!subject.trim()) next.subject = "Subject is required.";
    if (template === "custom" && !message.trim()) next.message = "Message is required.";
    if (needsEmail && !email.trim()) next.email = "Email is required for this channel.";
    if (needsPhone) {
      if (!phone.trim()) {
        next.phone = "Phone number is required for this channel.";
      } else {
        const phoneErr = validatePhone(phone);
        if (phoneErr) next.phone = phoneErr;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    setApiError(null);
    if (!validate()) return;
    if (template === "custom") {
      const payload: SendToUserPayload = {
        subject: subject.trim(),
        message: message.trim(),
        channel,
        ...(needsEmail ? { email: email.trim() } : {}),
        ...(needsPhone ? { phone: phone.trim() } : {}),
      };
      mutation.mutate(payload);
    } else {
      const filledItems = items.filter((i) => i.title.trim() || i.image.trim());
      const payload: SendToUserPromotionalPayload = {
        subject: subject.trim(),
        channel,
        ...(needsEmail ? { email: email.trim() } : {}),
        ...(needsPhone ? { phone: phone.trim() } : {}),
        ...(heroImage.trim() ? { heroImage: heroImage.trim() } : {}),
        ...(heroCTA.trim() ? { heroCTA: heroCTA.trim() } : {}),
        ...(bodyTitle.trim() ? { bodyTitle: bodyTitle.trim() } : {}),
        ...(bodyText.trim() ? { bodyText: bodyText.trim() } : {}),
        ...(bodyCta.trim() ? { bodyCta: bodyCta.trim() } : {}),
        ...(bodyCtaUrl.trim() ? { bodyCtaUrl: bodyCtaUrl.trim() } : {}),
        ...(gridTitle.trim() ? { gridTitle: gridTitle.trim() } : {}),
        ...(filledItems.length > 0
          ? { items: filledItems.map((i) => ({ image: i.image.trim(), title: i.title.trim() })) }
          : {}),
        ...(featuredImage.trim() ? { featuredImage: featuredImage.trim() } : {}),
        ...(featuredTitle.trim() ? { featuredTitle: featuredTitle.trim() } : {}),
        ...(featuredBody.trim() ? { featuredBody: featuredBody.trim() } : {}),
      };
      mutation.mutate(payload);
    }
  }

  function addItem() {
    if (items.length < 4) setItems((prev) => [...prev, { image: "", title: "" }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof GridItem, val: string) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Template picker */}
      <div className="flex flex-col gap-1.5">
        <Label>Template</Label>
        <div className="grid grid-cols-2 gap-3 sm:max-w-xs">
          {(["custom", "promotional"] as TemplateType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTemplate(t)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                template === t
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <span className="font-medium capitalize">{t}</span>
              <p className="mt-0.5 font-normal text-muted-foreground text-xs">
                {t === "custom" ? "Plain subject + message" : "Rich email with images"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Subject */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="su-subject">
          Subject <span className="text-destructive">*</span>
        </Label>
        <Input
          id="su-subject"
          placeholder="e.g. Your exclusive offer"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
          }}
          aria-invalid={!!errors.subject}
        />
        {errors.subject && <p className="text-destructive text-xs">{errors.subject}</p>}
      </div>

      {/* Channel */}
      <div className="flex flex-col gap-1.5">
        <Label>Channel</Label>
        <Select
          value={channel}
          onValueChange={(v) => {
            setChannel(v as PromotionChannel);
            setErrors({});
          }}
        >
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="both">Email + SMS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipient fields */}
      {(needsEmail || needsPhone) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {needsEmail && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-email">
                Email address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="su-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
            </div>
          )}
          {needsPhone && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-phone">
                Phone number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="su-phone"
                type="tel"
                placeholder="0241234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                }}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
            </div>
          )}
        </div>
      )}

      {/* Custom: message textarea */}
      {template === "custom" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="su-message">
            Message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="su-message"
            placeholder="Write your message here…"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
            }}
            className="min-h-36 resize-none"
            aria-invalid={!!errors.message}
          />
          {errors.message && <p className="text-destructive text-xs">{errors.message}</p>}
        </div>
      )}

      {/* Promotional sections */}
      {template === "promotional" && (
        <div className="flex flex-col gap-6">
          {/* Hero */}
          <div className="flex flex-col gap-4">
            <SectionHeading>Hero</SectionHeading>
            <ImageUrlField
              id="su-heroImage"
              label="Hero Image URL"
              value={heroImage}
              onChange={setHeroImage}
              placeholder="https://cdn.bidchale.com/promo/hero.jpg"
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-heroCTA">Hero CTA Text</Label>
              <Input
                id="su-heroCTA"
                placeholder="e.g. See For Yourself"
                value={heroCTA}
                onChange={(e) => setHeroCTA(e.target.value)}
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4">
            <SectionHeading>Body</SectionHeading>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-bodyTitle">Title</Label>
              <Input
                id="su-bodyTitle"
                placeholder="e.g. Your Next Win Awaits"
                value={bodyTitle}
                onChange={(e) => setBodyTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-bodyText">Body Text</Label>
              <Textarea
                id="su-bodyText"
                placeholder="e.g. These hand-picked auctions are waiting for your bid!"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="min-h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="su-bodyCta">CTA Button Label</Label>
                <Input
                  id="su-bodyCta"
                  placeholder="e.g. Start Winning"
                  value={bodyCta}
                  onChange={(e) => setBodyCta(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="su-bodyCtaUrl">CTA URL</Label>
                <Input
                  id="su-bodyCtaUrl"
                  type="url"
                  placeholder="https://www.bidchale.com/auctions"
                  value={bodyCtaUrl}
                  onChange={(e) => setBodyCtaUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-4">
            <SectionHeading>Grid Items</SectionHeading>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-gridTitle">Grid Title</Label>
              <Input
                id="su-gridTitle"
                placeholder="e.g. Top Weekend Wins"
                value={gridTitle}
                onChange={(e) => setGridTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: positional grid items
                <div key={i} className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
                    {item.image ? (
                      // biome-ignore lint/performance/noImgElement: user-provided CDN URL preview
                      <img src={item.image} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                  </div>
                  <Input
                    placeholder="Image URL"
                    value={item.image}
                    onChange={(e) => updateItem(i, "image", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) => updateItem(i, "title", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Minus className="size-4" />
                  </Button>
                </div>
              ))}
              {items.length < 4 && (
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-fit">
                  <Plus className="size-4" />
                  Add item
                </Button>
              )}
              <p className="text-muted-foreground text-xs">Up to 4 items. Each needs an image URL and a title.</p>
            </div>
          </div>

          {/* Featured */}
          <div className="flex flex-col gap-4">
            <SectionHeading>Featured Block</SectionHeading>
            <ImageUrlField
              id="su-featuredImage"
              label="Featured Image URL"
              value={featuredImage}
              onChange={setFeaturedImage}
              placeholder="https://cdn.bidchale.com/promo/labour-day.jpg"
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-featuredTitle">Featured Title</Label>
              <Input
                id="su-featuredTitle"
                placeholder="e.g. Holiday Hours"
                value={featuredTitle}
                onChange={(e) => setFeaturedTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-featuredBody">Featured Body</Label>
              <Textarea
                id="su-featuredBody"
                placeholder="e.g. Labour Day is next week! BidChale auctions will continue running."
                value={featuredBody}
                onChange={(e) => setFeaturedBody(e.target.value)}
                className="min-h-20 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Inline API error */}
      {apiError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5">
          <p className="text-destructive text-sm">{apiError}</p>
        </div>
      )}

      <Button className="self-end" disabled={mutation.isPending} onClick={handleSubmit}>
        <Send className="size-4" />
        {mutation.isPending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PromotionsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl leading-tight tracking-tight">Promotions</h1>
        <p className="text-muted-foreground text-sm">
          Broadcast messages to all users or send a targeted message to a specific account.
        </p>
      </div>

      <Tabs defaultValue="broadcast">
        <TabsList className="mb-2">
          <TabsTrigger value="broadcast" className="gap-2">
            <Megaphone className="size-4" />
            Broadcast
          </TabsTrigger>
          <TabsTrigger value="send-to-user" className="gap-2">
            <Users className="size-4" />
            Send to User
          </TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base leading-none">
                <Mail className="size-4 text-muted-foreground" />
                Broadcast Message
              </CardTitle>
              <CardDescription>
                Send a promotional message to a segment of active users. The broadcast is queued and delivered
                asynchronously — you will see a confirmation as soon as it is accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BroadcastTab token={token} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send-to-user">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base leading-none">
                <Send className="size-4 text-muted-foreground" />
                Send to Specific User
              </CardTitle>
              <CardDescription>
                Send a personal offer, coupon, or follow-up message directly to one account by email or phone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SendToUserTab token={token} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
