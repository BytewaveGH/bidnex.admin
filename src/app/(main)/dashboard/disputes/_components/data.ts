import { AlertCircle, ArrowDown, ArrowRight, ArrowUp, CheckCircle, Circle, CircleOff, Clock } from "lucide-react";
import { z } from "zod";

export const disputeSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
});

export type Dispute = z.infer<typeof disputeSchema>;

const disputesData = [
  {
    id: "DISP-1042",
    title: "Seller failed to deliver item within the agreed 5-day shipping window.",
    status: "open",
    label: "delivery",
    priority: "high",
  },
  {
    id: "DISP-1043",
    title: "Payment was released but the winning bid was not accepted by the seller.",
    status: "under review",
    label: "payment",
    priority: "high",
  },
  {
    id: "DISP-1044",
    title: "Item received does not match the description provided in the auction listing.",
    status: "resolved",
    label: "fraud",
    priority: "medium",
  },
  {
    id: "DISP-1045",
    title: "Seller cancelled bid after auction closed without valid reason.",
    status: "awaiting response",
    label: "contract",
    priority: "medium",
  },
  {
    id: "DISP-1046",
    title: "Buyer claims item was damaged in transit but seller disputes the claim.",
    status: "under review",
    label: "delivery",
    priority: "medium",
  },
  {
    id: "DISP-1047",
    title: "Refund not issued 14 days after return was confirmed received by seller.",
    status: "open",
    label: "payment",
    priority: "high",
  },
  {
    id: "DISP-1048",
    title: "Reserve price was not disclosed before auction; buyer alleges misrepresentation.",
    status: "dismissed",
    label: "fraud",
    priority: "low",
  },
  {
    id: "DISP-1049",
    title: "Duplicate charges applied to the winning bid for the same lot.",
    status: "resolved",
    label: "payment",
    priority: "high",
  },
  {
    id: "DISP-1050",
    title: "Seller listed counterfeit goods under an authenticated product category.",
    status: "open",
    label: "fraud",
    priority: "high",
  },
  {
    id: "DISP-1051",
    title: "Shipping carrier marked delivery as complete but buyer never received the item.",
    status: "awaiting response",
    label: "delivery",
    priority: "medium",
  },
  {
    id: "DISP-1052",
    title: "Auction extended without notice, causing buyer to miss final bid window.",
    status: "dismissed",
    label: "contract",
    priority: "low",
  },
  {
    id: "DISP-1053",
    title: "Seller is unresponsive after payment was processed for a private auction lot.",
    status: "open",
    label: "payment",
    priority: "high",
  },
  {
    id: "DISP-1054",
    title: "Item condition was listed as 'new' but arrived with visible signs of use.",
    status: "under review",
    label: "fraud",
    priority: "medium",
  },
  {
    id: "DISP-1055",
    title: "Bid retraction submitted within policy window was denied without explanation.",
    status: "awaiting response",
    label: "contract",
    priority: "medium",
  },
  {
    id: "DISP-1056",
    title: "Winning bidder did not complete payment within the required 48-hour settlement window.",
    status: "resolved",
    label: "payment",
    priority: "high",
  },
  {
    id: "DISP-1057",
    title: "Item was shipped to the wrong address despite correct details provided at checkout.",
    status: "open",
    label: "delivery",
    priority: "high",
  },
  {
    id: "DISP-1058",
    title: "Seller used shill bidding to artificially inflate the final auction price.",
    status: "under review",
    label: "fraud",
    priority: "high",
  },
  {
    id: "DISP-1059",
    title: "Partial lot delivered; remaining items have not arrived after 3 weeks.",
    status: "awaiting response",
    label: "delivery",
    priority: "medium",
  },
  {
    id: "DISP-1060",
    title: "Proxy bid system malfunction resulted in bid being placed above the buyer's maximum.",
    status: "open",
    label: "contract",
    priority: "medium",
  },
  {
    id: "DISP-1061",
    title: "Buyer disputes final fee calculation; claims platform surcharge was applied twice.",
    status: "under review",
    label: "payment",
    priority: "low",
  },
  {
    id: "DISP-1062",
    title: "Seller changed item photos after auction closed to ones that do not match the physical item.",
    status: "open",
    label: "fraud",
    priority: "high",
  },
  {
    id: "DISP-1063",
    title: "Return request rejected despite item arriving broken due to improper packaging.",
    status: "awaiting response",
    label: "delivery",
    priority: "high",
  },
  {
    id: "DISP-1064",
    title: "Auction ended early without seller invoking the buy-it-now clause.",
    status: "dismissed",
    label: "contract",
    priority: "low",
  },
  {
    id: "DISP-1065",
    title: "Currency conversion fee was applied at an undisclosed exchange rate.",
    status: "resolved",
    label: "payment",
    priority: "medium",
  },
  {
    id: "DISP-1066",
    title: "Item was listed as originating from domestic seller but shipped from overseas.",
    status: "open",
    label: "fraud",
    priority: "medium",
  },
  {
    id: "DISP-1067",
    title: "Seller retracted acceptance of winning bid after the auction concluded.",
    status: "under review",
    label: "contract",
    priority: "high",
  },
  {
    id: "DISP-1068",
    title: "Tracking number provided by seller is invalid or unrecognized by carrier.",
    status: "awaiting response",
    label: "delivery",
    priority: "medium",
  },
  {
    id: "DISP-1069",
    title: "Escrow funds held beyond agreed release period after delivery was confirmed.",
    status: "open",
    label: "payment",
    priority: "high",
  },
  {
    id: "DISP-1070",
    title: "Lot description omitted known defects; buyer alleges fraudulent non-disclosure.",
    status: "under review",
    label: "fraud",
    priority: "high",
  },
  {
    id: "DISP-1071",
    title: "Second highest bidder was incorrectly awarded the lot after a cancellation.",
    status: "awaiting response",
    label: "contract",
    priority: "medium",
  },
];

export const disputes = z.array(disputeSchema).parse(disputesData);

export const labels = [
  {
    value: "payment",
    label: "Payment",
  },
  {
    value: "delivery",
    label: "Delivery",
  },
  {
    value: "fraud",
    label: "Fraud",
  },
  {
    value: "contract",
    label: "Contract",
  },
];

export const statuses = [
  {
    value: "open",
    label: "Open",
    icon: Circle,
  },
  {
    value: "under review",
    label: "Under Review",
    icon: Clock,
  },
  {
    value: "awaiting response",
    label: "Awaiting Response",
    icon: AlertCircle,
  },
  {
    value: "resolved",
    label: "Resolved",
    icon: CheckCircle,
  },
  {
    value: "dismissed",
    label: "Dismissed",
    icon: CircleOff,
  },
];

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDown,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRight,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUp,
  },
];
