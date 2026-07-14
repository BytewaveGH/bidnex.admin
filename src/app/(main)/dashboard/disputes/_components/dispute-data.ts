import { CheckCircle, Circle, CircleOff, Clock } from "lucide-react";

export interface Dispute {
  id: number;
  lotId: number;
  buyerId: number;
  sellerId: number;
  reason: string;
  status: string;
  filedAt: string;
  createdAt: string;
}

export interface DisputeMessage {
  id: number;
  disputeId: number;
  senderId: number;
  message: string;
  createdAt: string;
}

export interface DisputeDetail extends Dispute {
  description: string;
  messages: DisputeMessage[];
}

export const statuses = [
  {
    value: "open",
    label: "Open",
    icon: Circle,
  },
  {
    value: "underReview",
    label: "Under Review",
    icon: Clock,
  },
  {
    value: "resolved",
    label: "Resolved",
    icon: CheckCircle,
  },
  {
    value: "closed",
    label: "Closed",
    icon: CircleOff,
  },
];
