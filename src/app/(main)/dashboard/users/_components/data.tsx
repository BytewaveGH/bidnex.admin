export type UserAccountType = "bidder" | "vendor" | "admin";

export interface IAdminUser {
  id: number;
  username: string;
  email: string;
  phone?: string;
  accountType: UserAccountType;
  isVerified: boolean;
  status: "active" | "suspended";
  createdAt: string;
}

export const users: IAdminUser[] = [
  {
    id: 1,
    username: "Benedicta Abobi",
    email: "abenedicta223@gmail.com",
    accountType: "bidder",
    isVerified: true,
    status: "active",
    createdAt: "2026-06-25T08:14:00Z",
  },
  {
    id: 2,
    username: "melvinadongo.gh",
    email: "melvinadongo.gh@gmail.com",
    phone: "0556788343",
    accountType: "bidder",
    isVerified: false,
    status: "active",
    createdAt: "2026-06-25T09:02:00Z",
  },
  {
    id: 3,
    username: "Michael Opoku",
    email: "michaelopokudigimanager@gmail.com",
    accountType: "bidder",
    isVerified: true,
    status: "active",
    createdAt: "2026-06-25T10:31:00Z",
  },
  {
    id: 4,
    username: "Michael Opoku",
    email: "famousmichael71@gmail.com",
    accountType: "bidder",
    isVerified: true,
    status: "active",
    createdAt: "2026-06-25T11:45:00Z",
  },
  {
    id: 5,
    username: "dawg",
    email: "m@mail.com",
    phone: "0202622678",
    accountType: "bidder",
    isVerified: false,
    status: "active",
    createdAt: "2026-06-25T13:20:00Z",
  },
  {
    id: 6,
    username: "john_doe",
    email: "dummy@mail.com",
    phone: "0201234567",
    accountType: "bidder",
    isVerified: false,
    status: "active",
    createdAt: "2026-06-25T14:05:00Z",
  },
  {
    id: 7,
    username: "Ahmed",
    email: "alhajiahmed400@gmail.com",
    phone: "0557356616",
    accountType: "bidder",
    isVerified: false,
    status: "active",
    createdAt: "2026-06-10T07:33:00Z",
  },
  {
    id: 8,
    username: "Jomes",
    email: "Sylmjomes67@gmail.com",
    phone: "0533087985",
    accountType: "bidder",
    isVerified: false,
    status: "active",
    createdAt: "2026-06-09T16:18:00Z",
  },
  {
    id: 9,
    username: "adminuser",
    email: "admin@gems.bid",
    phone: "0244000001",
    accountType: "admin",
    isVerified: false,
    status: "active",
    createdAt: "2026-06-05T06:00:00Z",
  },
  {
    id: 10,
    username: "Kwame Asante",
    email: "kwame.asante@vendorco.gh",
    phone: "0302445566",
    accountType: "vendor",
    isVerified: true,
    status: "active",
    createdAt: "2026-05-18T10:00:00Z",
  },
  {
    id: 11,
    username: "Abena Mensah",
    email: "abena.m@goldcoastvendors.com",
    phone: "0241887765",
    accountType: "vendor",
    isVerified: true,
    status: "active",
    createdAt: "2026-05-10T08:45:00Z",
  },
  {
    id: 12,
    username: "kofi_trades",
    email: "kofi.trades@mail.com",
    phone: "0277123456",
    accountType: "vendor",
    isVerified: false,
    status: "suspended",
    createdAt: "2026-04-22T12:30:00Z",
  },
  {
    id: 13,
    username: "Yaw Boateng",
    email: "yboateng@gmail.com",
    accountType: "bidder",
    isVerified: true,
    status: "suspended",
    createdAt: "2026-04-15T09:10:00Z",
  },
  {
    id: 14,
    username: "superadmin",
    email: "superadmin@gems.bid",
    phone: "0200000000",
    accountType: "admin",
    isVerified: true,
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

export const statusMeta: Record<"active" | "suspended", { badgeClass: string; dotClass: string }> = {
  active: {
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  suspended: {
    badgeClass: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
};

export const accountTypeMeta: Record<UserAccountType, { badgeClass: string; label: string }> = {
  bidder: {
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    label: "Bidder",
  },
  vendor: {
    badgeClass: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    label: "Vendor",
  },
  admin: {
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    label: "Admin",
  },
};
