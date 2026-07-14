"use client";

import * as React from "react";

import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { type DisputeDetail, statuses } from "../../_components/dispute-data";
import { DisputeServices } from "../../_logics/services";

const statusStyles: Record<string, string> = {
  open: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  underReview: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  resolved: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  closed: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${hours}:${minutes}`;
}

interface Props {
  dispute: DisputeDetail;
}

export function DisputeReview({ dispute }: Props) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const [reply, setReply] = React.useState("");

  const replyMutation = useMutation({
    mutationFn: (message: string) => {
      const svc = DisputeServices.PostMessage(dispute.id);
      return apiRequest(svc.endpoint, token, { method: svc.method, body: { message } });
    },
    onSuccess: () => {
      setReply("");
      void queryClient.invalidateQueries({ queryKey: ["admin-dispute", String(dispute.id)] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to send reply."),
  });

  const status = statuses.find((s) => s.value === dispute.status);

  function senderLabel(senderId: number) {
    if (senderId === dispute.buyerId) return "Buyer";
    if (dispute.sellerId && senderId === dispute.sellerId) return "Seller";
    return "Support";
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground" asChild>
        <Link href="/dashboard/disputes">
          <ChevronLeft className="size-4" />
          Disputes
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold text-2xl leading-tight tracking-tight">Dispute #{dispute.id}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("gap-1.5 rounded-full px-2.5", statusStyles[dispute.status])}>
              {status?.icon && <status.icon className="size-3.5" />}
              {status?.label ?? dispute.status}
            </Badge>
            <span className="text-muted-foreground text-sm">Filed {formatDateTime(dispute.filedAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">{dispute.reason}</CardTitle>
              <CardDescription>Reason filed by the buyer.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed">{dispute.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Messages</CardTitle>
              <CardDescription>Conversation thread between the buyer, seller, and support.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {dispute.messages.length ? (
                  dispute.messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col gap-1 rounded-md border px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-xs">{senderLabel(msg.senderId)}</span>
                        <span className="text-muted-foreground text-xs">{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No messages yet.</p>
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Reply to this dispute…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="min-h-24 resize-none"
                />
                <Button
                  className="w-fit self-end"
                  disabled={!reply.trim() || replyMutation.isPending}
                  onClick={() => replyMutation.mutate(reply.trim())}
                >
                  <Send className="size-4" />
                  {replyMutation.isPending ? "Sending…" : "Send Reply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base leading-none">Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Lot</p>
                <Link href={`/dashboard/vendor-lots/${dispute.lotId}`} className="font-medium text-sm hover:underline">
                  #{dispute.lotId}
                </Link>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Buyer</p>
                <p className="font-medium text-sm">#{dispute.buyerId}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Seller</p>
                <p className="font-medium text-sm">{dispute.sellerId ? `#${dispute.sellerId}` : "—"}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Filed</p>
                <p className="font-medium text-sm">{formatDateTime(dispute.filedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
