export type PromotionChannel = "email" | "sms" | "both";
export type PromotionTarget = "all" | "bidders" | "vendors";

export interface BroadcastPayload {
  subject: string;
  message: string;
  channel?: PromotionChannel;
  target?: PromotionTarget;
}

export interface SendToUserPayload {
  subject: string;
  message: string;
  channel?: PromotionChannel;
  email?: string;
  phone?: string;
}

export const PromotionServices = {
  Broadcast() {
    return { endpoint: "/api/admin/promotions/broadcast", method: "POST" as const };
  },
  SendToUser() {
    return { endpoint: "/api/admin/promotions/test", method: "POST" as const };
  },
};
