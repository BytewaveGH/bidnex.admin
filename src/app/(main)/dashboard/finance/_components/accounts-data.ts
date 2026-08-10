export type PayoutAccountType = "mobile_money" | "bank";

export interface VendorPayoutAccount {
  id: number;
  vendorId: number;
  vendorName: string;
  accountType: PayoutAccountType;
  provider: string;
  accountNumber: string;
  accountName: string;
  addedAt: string;
}

export const vendorPayoutAccounts: VendorPayoutAccount[] = [
  {
    id: 1,
    vendorId: 3,
    vendorName: "vendor",
    accountType: "mobile_money",
    provider: "MTN Mobile Money",
    accountNumber: "0505721806",
    accountName: "OPOKU MICHAEL",
    addedAt: "2026-03-14T09:20:00Z",
  },
  {
    id: 2,
    vendorId: 25,
    vendorName: "Dionne Amoah",
    accountType: "mobile_money",
    provider: "Telecel Cash",
    accountNumber: "0207743321",
    accountName: "DIONNE AMOAH",
    addedAt: "2026-02-02T11:05:00Z",
  },
  {
    id: 3,
    vendorId: 32,
    vendorName: "Ato Kwame",
    accountType: "bank",
    provider: "GCB Bank",
    accountNumber: "1102003345671",
    accountName: "ATO KWAME MENSAH",
    addedAt: "2026-01-27T15:40:00Z",
  },
  {
    id: 4,
    vendorId: 10,
    vendorName: "Kwame Asante",
    accountType: "mobile_money",
    provider: "AirtelTigo Money",
    accountNumber: "0271234567",
    accountName: "KWAME ASANTE",
    addedAt: "2026-04-01T08:15:00Z",
  },
  {
    id: 5,
    vendorId: 11,
    vendorName: "Abena Mensah",
    accountType: "bank",
    provider: "Fidelity Bank",
    accountNumber: "4400981123456",
    accountName: "ABENA MENSAH",
    addedAt: "2026-03-22T13:50:00Z",
  },
  {
    id: 6,
    vendorId: 12,
    vendorName: "kofi_trades",
    accountType: "mobile_money",
    provider: "MTN Mobile Money",
    accountNumber: "0244556677",
    accountName: "KOFI OWUSU",
    addedAt: "2026-02-18T10:30:00Z",
  },
  {
    id: 7,
    vendorId: 41,
    vendorName: "Akosua Boateng",
    accountType: "mobile_money",
    provider: "Telecel Cash",
    accountNumber: "0203344556",
    accountName: "AKOSUA BOATENG",
    addedAt: "2026-05-09T16:00:00Z",
  },
  {
    id: 8,
    vendorId: 47,
    vendorName: "Yaw Antwi",
    accountType: "bank",
    provider: "Ecobank Ghana",
    accountNumber: "3301122334455",
    accountName: "YAW ANTWI",
    addedAt: "2026-06-03T12:10:00Z",
  },
];
