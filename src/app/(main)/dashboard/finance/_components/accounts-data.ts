export type PayoutAccountType = "mobile_money" | "bank";

export interface VendorPayoutAccount {
  id: number;
  vendorId: number;
  type: PayoutAccountType;
  provider: string;
  accountName: string;
  accountNo: string;
  isDefault: boolean;
  createdAt: string;
}
