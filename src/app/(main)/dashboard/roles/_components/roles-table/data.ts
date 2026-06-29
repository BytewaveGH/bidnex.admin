export interface IPermission {
  id: number;
  resource: string;
  action: string;
  key: string; // "resource.action"
}

export interface IRole {
  id: number;
  name: string;
  label: string;
  description?: string;
  isSystem: boolean;
  permissions: string[];
  usersCount?: number;
}

export interface IRoleWithUsers extends IRole {
  users: Array<{
    id: number;
    username: string;
    email: string;
    assignedAt: string;
  }>;
}

// Alias kept so columns/table can import `Role`
export type Role = IRole;

export const RESOURCE_LABELS: Record<string, string> = {
  analytics: "Analytics",
  auctions: "Auctions",
  lots: "Vendor Lots",
  categories: "Categories",
  users: "Users",
  finance: "Finance",
  disputes: "Disputes",
  roles: "Roles & Permissions",
};

export const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
  credit: "Credit Wallet",
  retry_payout: "Retry Payout",
  resolve: "Resolve",
  assign: "Assign",
};
