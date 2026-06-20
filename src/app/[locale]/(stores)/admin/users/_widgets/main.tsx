'use client'

import React, { useMemo, useState } from 'react'
import { ColDef } from 'ag-grid-community'
import { CheckCircle, XCircle, Users, UserX, Wallet, Search, Filter, X, Package, Tag, Clock, AlertCircle } from 'lucide-react'
import DatagridTemplate from '@/components/templates/datagrid'
import { SheetTemplate } from '@/components/templates/sheet'
import { useFetchData } from '@/hooks/use-fetch'
import { useFetchPaginated } from '@/hooks/use-fetch-paginated'
import { useAxios } from '@/hooks/use-axios'
import { IGeneric } from '@/types/interfaces'
import { IAdminUser, ILot, LotReviewStatus, UserAccountType } from '@/types/interfaces/gems-bid'
import { UserAdminServices } from '../_logics/services'
import { LotServices } from '../../auctions/_logics/lot-services'
import { toast } from 'sonner'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<UserAccountType, string> = {
  bidder: 'bg-blue-50 text-blue-700 border border-blue-200',
  vendor: 'bg-purple-50 text-purple-700 border border-purple-200',
  admin: 'bg-amber-50 text-amber-700 border border-amber-200',
}

const REVIEW_STATUS_STYLES: Record<LotReviewStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border border-gray-200',
  submitted: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
}

const TYPE_FILTERS: { label: string; value: UserAccountType | '' }[] = [
  { label: 'All Users', value: '' },
  { label: 'Bidders', value: 'bidder' },
  { label: 'Vendors', value: 'vendor' },
  { label: 'Admins', value: 'admin' },
]

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
      <span className="text-xs text-gray-500">{total > 0 ? `Showing ${from}–${to} of ${total} users` : 'No users found'}</span>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSize(Number(e.target.value))
            onPage(0)
          }}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-endeavour bg-white"
        >
          {[20, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s} per page
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            disabled={page === 0}
            onClick={() => onPage(page - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-30 hover:border-endeavour hover:text-endeavour transition-all text-xs font-bold"
          >
            ‹
          </button>
          <span className="text-xs font-semibold text-stone-700 px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => onPage(page + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white disabled:opacity-30 hover:border-endeavour hover:text-endeavour transition-all text-xs font-bold"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Vendor Lots Sheet ────────────────────────────────────────────────────────

const VendorLotsContent = ({ vendor }: { vendor: IAdminUser }) => {
  const [reviewFilter, setReviewFilter] = useState<LotReviewStatus | 'all'>('all')

  const { data: lotsRaw, isLoading } = useFetchData(`vendor-lots-${vendor.id}`, LotServices.FetchByVendor(vendor.id) as unknown as IGeneric)
  const allLots = (lotsRaw as ILot[]) ?? []

  const lots = reviewFilter === 'all' ? allLots : allLots.filter((l) => l.reviewStatus === reviewFilter)

  const counts: Record<string, number> = {
    all: allLots.length,
    submitted: allLots.filter((l) => l.reviewStatus === 'submitted').length,
    approved: allLots.filter((l) => l.reviewStatus === 'approved').length,
    rejected: allLots.filter((l) => l.reviewStatus === 'rejected').length,
  }

  const fmt = (v: number) => `GHS ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  const tabs: { key: LotReviewStatus | 'all'; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'submitted', label: `Pending (${counts.submitted})` },
    { key: 'approved', label: `Approved (${counts.approved})` },
    { key: 'rejected', label: `Rejected (${counts.rejected})` },
  ]

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-5 flex-1 overflow-hidden">
      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReviewFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              reviewFilter === tab.key ? 'bg-white text-stone-800 shadow-sm' : 'text-gray-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lots */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400">
            <Package className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No lots found</p>
            <p className="text-xs mt-1 text-gray-300">
              {allLots.length === 0 ? 'This vendor has no lots yet' : 'No lots in this category'}
            </p>
          </div>
        ) : (
          lots.map((lot) => (
            <div
              key={lot.id}
              className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-start gap-3 hover:shadow-sm transition-shadow"
            >
              {/* Image */}
              <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {lot.primaryImage ? (
                  <img src={lot.primaryImage} alt={lot.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-5 w-5 text-gray-300" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm font-bold text-stone-800 flex-1 truncate">{lot.title}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize flex-shrink-0 ${REVIEW_STATUS_STYLES[lot.reviewStatus] ?? 'bg-gray-100 text-gray-500'}`}
                  >
                    {lot.reviewStatus}
                  </span>
                </div>

                {lot.condition && <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{lot.condition.replace(/_/g, ' ')}</p>}

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-500">
                    Starting: <strong className="text-stone-700">{fmt(lot.startingBid)}</strong>
                  </span>
                  {lot.auctionId && (
                    <span className="text-xs text-endeavour font-semibold flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Auction #{lot.auctionId}
                    </span>
                  )}
                  {lot.bidEndTime && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Closes {new Date(lot.bidEndTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                {lot.reviewStatus === 'rejected' && lot.reviewRejectReason && (
                  <div className="flex items-start gap-1.5 mt-2 bg-red-50 rounded-lg px-2.5 py-1.5">
                    <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-600">{lot.reviewRejectReason}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Main = () => {
  const request = useAxios()

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [accountTypeFilter, setAccountTypeFilter] = useState<UserAccountType | ''>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'suspended' | ''>('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [creditTarget, setCreditTarget] = useState<IAdminUser | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditDescription, setCreditDescription] = useState('')
  const [isActioning, setIsActioning] = useState(false)

  const [vendorLotsTarget, setVendorLotsTarget] = useState<IAdminUser | null>(null)

  const queryKey = `admin-users-${accountTypeFilter}-${statusFilter}-${search}`
  const {
    data: users,
    total,
    isLoading,
    refetch,
  } = useFetchPaginated(
    queryKey,
    UserAdminServices.FetchAll({
      ...(accountTypeFilter ? { accountType: accountTypeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    }) as unknown as IGeneric,
    page,
    pageSize
  )

  const handleSuspend = async (user: IAdminUser) => {
    try {
      await request(UserAdminServices.Suspend(user.id) as any)
      toast.success(`${user.username} suspended`)
      refetch()
    } catch {
      toast.error('Failed to suspend user')
    }
  }

  const handleActivate = async (user: IAdminUser) => {
    try {
      await request(UserAdminServices.Activate(user.id) as any)
      toast.success(`${user.username} activated`)
      refetch()
    } catch {
      toast.error('Failed to activate user')
    }
  }

  const handleCreditWallet = async () => {
    if (!creditTarget || Number(creditAmount) <= 0 || !creditDescription.trim()) return
    setIsActioning(true)
    try {
      await request(
        UserAdminServices.CreditWallet(creditTarget.id, {
          amount: Number(creditAmount),
          description: creditDescription.trim(),
        }) as any
      )
      toast.success(`Wallet credited for ${creditTarget.username}`)
      setCreditTarget(null)
      setCreditAmount('')
      setCreditDescription('')
      refetch()
    } catch {
      toast.error('Failed to credit wallet')
    } finally {
      setIsActioning(false)
    }
  }

  const columns: ColDef[] = useMemo(
    () => [
      {
        field: 'username',
        headerName: 'User',
        flex: 1,
        minWidth: 180,
        cellRenderer: ({ data: row }: any) => {
          if (!row) return null
          const initial = row.username?.[0]?.toUpperCase() ?? 'U'
          return (
            <div className="flex items-center gap-2.5 h-full">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-endeavour to-veniceBlue flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initial}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800">{row.username}</p>
                <p className="text-xs text-gray-400">{row.email}</p>
              </div>
            </div>
          )
        },
      },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 130,
        valueFormatter: (p: any) => p.value ?? '—',
        cellStyle: { color: '#6b7280', fontSize: '13px' },
      },
      {
        field: 'accountType',
        headerName: 'Type',
        width: 110,
        cellRenderer: ({ value }: any) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${TYPE_STYLES[value as UserAccountType] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {value}
          </span>
        ),
      },
      {
        field: 'isVerified',
        headerName: 'Verified',
        width: 100,
        cellRenderer: ({ value }: any) =>
          value ? (
            <div className="flex items-center justify-center h-full">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <XCircle className="h-4 w-4 text-gray-300" />
            </div>
          ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        cellRenderer: ({ value }: any) => (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              value === 'active' || !value
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${value === 'active' || !value ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {value === 'suspended' ? 'Suspended' : 'Active'}
          </span>
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Joined',
        width: 120,
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
        cellStyle: { color: '#9ca3af', fontSize: '12px' },
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 220,
        pinned: 'right' as const,
        sortable: false,
        filter: false,
        cellRenderer: ({ data: row }: any) => {
          if (!row) return null
          const isSuspended = row.status === 'suspended'
          const isVendor = row.accountType === 'vendor'
          return (
            <div className="flex items-center gap-1.5 h-full">
              {isVendor && (
                <button
                  onClick={() => setVendorLotsTarget(row)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                >
                  <Package className="h-3 w-3" /> Lots
                </button>
              )}
              {isSuspended ? (
                <button
                  onClick={() => handleActivate(row)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle className="h-3 w-3" /> Activate
                </button>
              ) : (
                <button
                  onClick={() => handleSuspend(row)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100 transition-colors"
                >
                  <UserX className="h-3 w-3" /> Suspend
                </button>
              )}
              <button
                onClick={() => setCreditTarget(row)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <Wallet className="h-3 w-3" /> Credit
              </button>
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <main className="w-full flex flex-col gap-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage platform users — bidders, vendors, and admins</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs text-gray-500">
          <Users className="h-3.5 w-3.5 text-endeavour" />
          <span className="font-semibold text-stone-700">{total}</span>
          <span>users</span>
        </div>
      </header>

      {/* Filter & Search — single bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Type:</span>
        </div>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setAccountTypeFilter(f.value)
              setPage(0)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              accountTypeFilter === f.value ? 'bg-endeavour text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200" />
        {(['', 'active', 'suspended'] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setStatusFilter(v)
              setPage(0)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === v
                ? v === ''
                  ? 'bg-stone-800 text-white'
                  : v === 'active'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {v === '' ? 'All Statuses' : v === 'active' ? 'Active' : 'Suspended'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 min-w-[200px]">
          <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(searchInput)
                setPage(0)
              }
            }}
            placeholder="Search by username or email…"
            className="flex-1 bg-transparent text-sm text-stone-700 focus:outline-none placeholder-gray-400"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearch('')
                setSearchInput('')
                setPage(0)
              }}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <DatagridTemplate
          columns={columns}
          data={(users as IAdminUser[]) ?? []}
          enablePagination={false}
          paginationPageSize={pageSize}
          selectionType="singleRow"
          loadingIndicator={isLoading}
          containerHeight={480}
          enableCheckboxes={false}
        />
        <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Vendor Lots Sheet */}
      <SheetTemplate
        open={!!vendorLotsTarget}
        title="Vendor Lots"
        headerRightText={vendorLotsTarget ? `${vendorLotsTarget.username} · #${vendorLotsTarget.id}` : ''}
        handleClose={() => setVendorLotsTarget(null)}
        contentClassName="md:min-w-[600px]"
        contentBodyClassName="flex flex-col p-0 overflow-hidden"
        content={vendorLotsTarget ? <VendorLotsContent vendor={vendorLotsTarget} /> : <></>}
      />

      {/* Credit Wallet Modal */}
      {creditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] flex flex-col gap-5 mx-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800">Credit Wallet</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Funds are added to the user's available balance</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCreditTarget(null)
                  setCreditAmount('')
                  setCreditDescription('')
                }}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-endeavour to-veniceBlue flex items-center justify-center">
                <span className="text-sm font-bold text-white">{creditTarget.username[0]?.toUpperCase() ?? 'U'}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800">{creditTarget.username}</p>
                <p className="text-xs text-gray-500">{creditTarget.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">
                Amount (GHS) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">GHS</span>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  className="w-full border border-gray-200 bg-gray-50/50 rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all placeholder-gray-400 font-medium"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700">
                Reason / Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                rows={3}
                placeholder="e.g. Promotional credit, compensation for disruption, refund..."
                className="border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour resize-none placeholder-gray-400 transition-all"
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  setCreditTarget(null)
                  setCreditAmount('')
                  setCreditDescription('')
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!creditAmount || Number(creditAmount) <= 0 || !creditDescription.trim() || isActioning}
                onClick={handleCreditWallet}
                className="flex-1 py-2.5 rounded-xl bg-endeavour text-white text-sm font-bold hover:bg-veniceBlue disabled:opacity-40 transition-colors"
              >
                {isActioning ? 'Processing...' : `Credit GHS ${creditAmount || '0.00'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Main
