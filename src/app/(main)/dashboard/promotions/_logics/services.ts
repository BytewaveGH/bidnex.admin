export type PromotionChannel = "email" | "sms" | "both";
export type PromotionTarget = "all" | "bidders" | "vendors";

export interface BroadcastPayload {
  subject: string;
  message: string;
  channel?: PromotionChannel;
  target?: PromotionTarget;
}

export interface PromotionalBroadcastPayload {
  subject: string;
  channel?: PromotionChannel;
  target?: PromotionTarget;
  heroImage?: string;
  heroCTA?: string;
  bodyTitle?: string;
  bodyText?: string;
  bodyCta?: string;
  bodyCtaUrl?: string;
  gridTitle?: string;
  items?: { image: string; title: string }[];
  featuredImage?: string;
  featuredTitle?: string;
  featuredBody?: string;
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
