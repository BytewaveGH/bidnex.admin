export type CreateVendorLotPayload = {
  title: string;
  description: string;
  condition: string;
  reservePrice?: number;
  buyNowPrice?: number;
  categoryId: number;
  pickupAvailable: boolean;
  shippingAvailable: boolean;
  specifications?: Record<string, unknown>;
  vendorId: number;
};

export type CreateVendorLotApiResponse = {
  data?: { id?: number | string } | Record<string, unknown>;
  status?: boolean;
  message?: string;
  error?: string;
};

export function getCreatedLotId(response: CreateVendorLotApiResponse): string | null {
  const data = response.data;
  if (!data || typeof data !== "object" || !("id" in data) || data.id == null) return null;
  return String(data.id);
}
