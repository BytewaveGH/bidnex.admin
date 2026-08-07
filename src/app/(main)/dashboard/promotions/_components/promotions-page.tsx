"use client";
"use no memo";

import * as React from "react";

import { useMutation } from "@tanstack/react-query";
import { Mail, Megaphone, Send, Users } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";

import {
  type BroadcastPayload,
  type PromotionChannel,
  PromotionServices,
  type PromotionTarget,
  type SendToUserPayload,
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

// ── Broadcast tab ─────────────────────────────────────────────────────────────

function BroadcastTab({ token }: { token: string | undefined }) {
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [channel, setChannel] = React.useState<PromotionChannel>("email");
  const [target, setTarget] = React.useState<PromotionTarget>("all");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldError>({});
  const [apiError, setApiError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: BroadcastPayload) => {
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
    if (!message.trim()) next.message = "Message is required.";
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
    mutation.mutate({ subject: subject.trim(), message: message.trim(), channel, target });
  }

  const targetLabels: Record<PromotionTarget, string> = {
    all: "All Users",
    bidders: "Bidders Only",
    vendors: "Vendors Only",
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Subject */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bc-subject">Subject</Label>
          <Input
            id="bc-subject"
            placeholder="e.g. Exclusive deal this weekend"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
            }}
            aria-invalid={!!errors.subject}
          />
          {errors.subject && <p className="text-destructive text-xs">{errors.subject}</p>}
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bc-message">Message</Label>
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
              This will send to all matching active accounts via {channel === "both" ? "email and SMS" : channel}. Are
              you sure you want to continue?
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
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [channel, setChannel] = React.useState<PromotionChannel>("email");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [errors, setErrors] = React.useState<FieldError>({});
  const [apiError, setApiError] = React.useState<string | null>(null);

  const needsEmail = channel === "email" || channel === "both";
  const needsPhone = channel === "sms" || channel === "both";

  const mutation = useMutation({
    mutationFn: async (payload: SendToUserPayload) => {
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
    if (!message.trim()) next.message = "Message is required.";
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
    const payload: SendToUserPayload = {
      subject: subject.trim(),
      message: message.trim(),
      channel,
      ...(needsEmail ? { email: email.trim() } : {}),
      ...(needsPhone ? { phone: phone.trim() } : {}),
    };
    mutation.mutate(payload);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Subject */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="su-subject">Subject</Label>
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

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="su-message">Message</Label>
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

      {/* Conditional fields */}
      {(needsEmail || needsPhone) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {needsEmail && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-email">Email address</Label>
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
              <Label htmlFor="su-phone">Phone number</Label>
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
