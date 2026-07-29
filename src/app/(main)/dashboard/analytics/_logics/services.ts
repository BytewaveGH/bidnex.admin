export type AnalyticsRange = "last-7-days" | "last-4-weeks" | "last-3-months" | "year-to-date";

export interface KpiValue {
  value: number;
  change: number;
}

export interface AnalyticsPlatformKpis {
  uniqueVisitors: KpiValue;
  sessions: KpiValue;
  pageviews: KpiValue;
  engagementRate: KpiValue;
  conversionRate: KpiValue;
}

export interface TrafficQualityPoint {
  date: string;
  actualQuality: number;
  baselineQuality: number;
}

export interface VendorRow {
  id: number;
  name: string;
  submitted: number;
  approvalRate: number;
  avgFinalPrice: number;
  totalRevenue: number;
  status: "active" | "warning" | "inactive";
}

export interface AnalyticsPlatformData {
  kpis: AnalyticsPlatformKpis;
  trafficQuality: TrafficQualityPoint[];
  vendorPerformance: VendorRow[];
}

export interface RealtimeMinutePoint {
  minute: number;
  visitors: number;
}

export interface RealtimeVelocity {
  trend: "up" | "down";
  changePercent: number;
  last5Min: number;
  prior5Min: number;
}

export interface RealtimeHottestLot {
  id: number;
  title: string;
  currentBid: number;
  bidCount: number;
}

export interface RealtimeEndingSoonLot {
  id: number;
  title: string;
  bidEndTime: string;
  currentBid: number;
}

export interface RealtimeBidWar {
  id: number;
  title: string;
  currentBid: number;
  distinctBidders: number;
  bidCount: number;
}

export interface RealtimeHistoryPoint {
  label: string;
  activeBidders: number;
  bidsPerMinute: number;
  velocity: number;
}

export interface RealtimeHistory {
  daily: RealtimeHistoryPoint[];
  weekly: RealtimeHistoryPoint[];
  monthly: RealtimeHistoryPoint[];
}

export interface AnalyticsRealtimeData {
  onlineVisitors: number;
  perMinute: number;
  minuteSeries: RealtimeMinutePoint[];
  byCountry: unknown[];
  activeBidders: number;
  velocity: RealtimeVelocity;
  hottestLot: RealtimeHottestLot | null;
  endingSoon: { count: number; lots: RealtimeEndingSoonLot[] };
  bidWars: RealtimeBidWar[];
  history: RealtimeHistory;
}

export const AnalyticsPlatformServices = {
  Fetch(range: AnalyticsRange) {
    return {
      endpoint: "/api/admin/analytics/platform",
      params: { range } as Record<string, string>,
    };
  },
  FetchRealtime() {
    return { endpoint: "/api/admin/analytics/realtime" };
  },
};
