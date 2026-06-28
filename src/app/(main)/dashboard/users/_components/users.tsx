"use client";
"use no memo";

import * as React from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Grid, Rows3, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api-client";

import { type UserAccountType, UserAdminServices } from "../_logics/services";
import type { IAdminUser } from "./data";
import { UserDetailSheet } from "./user-detail-sheet";
import { makeUsersColumns } from "./users-columns";
import { UsersTable } from "./users-table";

// ── API response normalisation ────────────────────────────────────────────────

interface ApiUsersResponse {
  data?: { data?: IAdminUser[]; count?: number } | IAdminUser[];
}

function normalise(res: ApiUsersResponse): { users: IAdminUser[]; total: number } {
  const inner = res?.data;
  if (Array.isArray(inner)) return { users: inner, total: inner.length };
  const users = inner?.data ?? [];
  const total = inner?.count ?? users.length;
  return { users, total };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const accountTypeOptions = ["All", "bidder", "vendor", "admin"] as const;
const statusOptions = ["All", "active", "suspended"] as const;

const accountTypeLabels: Record<string, string> = {
  All: "All Users",
  bidder: "Bidder",
  vendor: "Vendor",
  admin: "Admin",
};
const statusLabels: Record<string, string> = {
  All: "All",
  active: "Active",
  suspended: "Suspended",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Users() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.accessToken;

  // ── Filter & pagination state ──────────────────────────────────────────────
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [accountTypeFilter, setAccountTypeFilter] = React.useState<UserAccountType | "">("");
  const [statusFilter, setStatusFilter] = React.useState<"active" | "suspended" | "">("");
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  // ── User detail sheet ──────────────────────────────────────────────────────
  const [viewUser, setViewUser] = React.useState<IAdminUser | null>(null);

  // ── Suspend/activate loading ───────────────────────────────────────────────
  const [loadingUserId, setLoadingUserId] = React.useState<number | null>(null);

  // ── Table state ────────────────────────────────────────────────────────────
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const queryClient = useQueryClient();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const queryKey = ["admin-users", accountTypeFilter, statusFilter, search, page, pageSize] as const;

  const {
    data: raw,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const svc = UserAdminServices.FetchAll({
        ...(accountTypeFilter ? { accountType: accountTypeFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
        limit: pageSize,
        page: page + 1,
      });
      return apiRequest<ApiUsersResponse>(svc.endpoint, token, { params: svc.params });
    },
    enabled: sessionStatus === "authenticated",
    placeholderData: (prev) => prev,
  });

  const { users, total } = React.useMemo(() => normalise(raw ?? {}), [raw]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  const suspendMutation = useMutation({
    mutationFn: async (user: IAdminUser) => {
      const svc = UserAdminServices.Suspend(user.id);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onMutate: (user) => setLoadingUserId(user.id),
    onSuccess: (_, user) => {
      toast.success(`${user.username} suspended.`);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to suspend user."),
    onSettled: () => setLoadingUserId(null),
  });

  const activateMutation = useMutation({
    mutationFn: async (user: IAdminUser) => {
      const svc = UserAdminServices.Activate(user.id);
      return apiRequest(svc.endpoint, token, { method: svc.method });
    },
    onMutate: (user) => setLoadingUserId(user.id),
    onSuccess: (_, user) => {
      toast.success(`${user.username} activated.`);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to activate user."),
    onSettled: () => setLoadingUserId(null),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function resetPage() {
    setPage(0);
  }

  function handleAccountTypeChange(value: string) {
    setAccountTypeFilter(value === "All" ? "" : (value as UserAccountType));
    resetPage();
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value === "All" ? "" : (value as "active" | "suspended"));
    resetPage();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setSearch(searchInput);
      resetPage();
    }
  }

  // ── Columns (memoised so they don't recreate on every render) ─────────────
  const cols = React.useMemo(
    () =>
      makeUsersColumns({
        onSuspend: (user) => suspendMutation.mutate(user),
        onActivate: (user) => activateMutation.mutate(user),
        onView: (user) => setViewUser(user),
        loadingUserId,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingUserId, suspendMutation.mutate, activateMutation.mutate],
  );

  // ── Table ─────────────────────────────────────────────────────────────────
  const table = useReactTable({
    data: users,
    columns: cols,
    pageCount: Math.max(Math.ceil(total / pageSize), 1),
    state: {
      rowSelection,
      sorting,
      columnVisibility,
      pagination: { pageIndex: page, pageSize },
    },
    getRowId: (row) => String(row.id),
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex: page, pageSize }) : updater;
      if (next.pageSize !== pageSize) {
        setPageSize(next.pageSize);
        setPage(0);
      } else setPage(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">
            Users
            {isFetching && !isLoading && (
              <span className="ml-2 font-normal text-muted-foreground text-xs">Refreshing…</span>
            )}
          </CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            Manage platform users — bidders, vendors, and admins
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            <InputGroup className="h-7 w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder="Search by username or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <InputGroupAddon align="inline-end">
                <Kbd className="h-4 text-[10px]">↵</Kbd>
              </InputGroupAddon>
            </InputGroup>
            {/* <Button variant="outline" size="sm"><SlidersHorizontal /> Hide</Button> */}
            {/* <Button variant="outline" size="sm"><Cog /> Customize</Button> */}
            {/* <Button variant="outline" size="sm"><Download /> Export</Button> */}
            {/* <Button size="sm"><Plus /> Add User</Button> */}
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={accountTypeFilter || "All"} onValueChange={handleAccountTypeChange}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Type:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    {accountTypeOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {accountTypeLabels[o]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={statusFilter || "All"} onValueChange={handleStatusChange}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Status:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    {statusOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {statusLabels[o]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-4">
            <div className="text-muted-foreground text-sm tabular-nums">{selectedCount} selected</div>
            <Tabs defaultValue="list">
              <TabsList>
                <TabsTrigger value="list" aria-label="List view">
                  <Rows3 />
                </TabsTrigger>
                <TabsTrigger value="grid" aria-label="Grid view">
                  <Grid />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">Loading users…</div>
          ) : (
            <UsersTable table={table} />
          )}
        </CardContent>
      </Card>

      <UserDetailSheet
        user={viewUser}
        open={!!viewUser}
        onOpenChange={(open) => {
          if (!open) setViewUser(null);
        }}
      />
    </>
  );
}
