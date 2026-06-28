'use client'

import React, { useMemo, useState } from 'react'

import {
  DollarSign,
  TrendingUp,
  ArrowRightLeft,
  LayoutList,
  Filter,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  ChevronRight,
} from 'lucide-react'
import DatagridTemplate from '@/components/templates/datagrid'
import { SheetTemplate } from '@/components/templates/sheet'
import { useFetchPaginated } from '@/hooks/use-fetch-paginated'
import { useFetchData } from '@/hooks/use-fetch'
import { useAxios } from '@/hooks/use-axios'
import { IGeneric } from '@/types/interfaces'
import { IFinanceStats, IPayout, PayoutStatus } from '@/types/interfaces/gems-bid'
import { FinanceServices } from '../_logics/services'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<PayoutStatus, { label: string; badge: string; pill: string; icon: React.ElementType }> = {
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pill: 'bg-emerald-500 text-white',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    badge: 'bg-red-50 text-red-700 border border-red-200',
    pill: 'bg-red-500 text-white',
    icon: XCircle,
  },
  pending_review: {
    label: 'Pending Review',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    pill: 'bg-amber-500 text-white',
    icon: Clock,
  },
}

const STATUS_FILTERS: { label: string; value: PayoutStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending Review', value: 'pending_review' },
]

const RETRYABLE: PayoutStatus[] = ['failed', 'pending_review']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (n: number) => `GH₵${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (s: string) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
  const meta = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${meta?.badge ?? 'bg-gray-100 text-gray-500'}`}
    >
      {meta?.label ?? status}
    </span>
  )
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: React.ReactNode
  color: string
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
    </div>
    <p className="text-xl sm:text-2xl font-bold text-stone-800 leading-none">{value}</p>
    {sub && <div className="text-xs text-gray-500">{sub}</div>}
  </div>
)

const Pagination = ({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  label = 'payouts',
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
  label?: string
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, total)
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl gap-2">
      <span className="text-xs text-gray-500">{total > 0 ? `Showing ${from}–${to} of ${total} ${label}` : `No ${label} found`}</span>
      <div className="flex items-center gap-2 self-end sm:self-auto">
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
              {s} / page
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

// ─── Main component ───────────────────────────────────────────────────────────

const Main = () => {
  const request = useAxios()
  const queryClient = useQueryClient()

  // Payouts table state
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | ''>('')

  // Payout detail sheet
  const [selectedPayoutId, setSelectedPayoutId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Vendor payouts sheet
  const [vendorSheetOpen, setVendorSheetOpen] = useState(false)
  const [vendorId, setVendorId] = useState<number | null>(null)
  const [vendorName, setVendorName] = useState<string>('')
  const [vendorPage, setVendorPage] = useState(0)
  const [vendorPageSize, setVendorPageSize] = useState(20)

  // ── Data fetches ─────────────────────────────────────────────────────────

  const { data: statsRaw } = useFetchData('admin-finance-stats', FinanceServices.FetchStats() as unknown as IGeneric)
  const stats = statsRaw as IFinanceStats | null

  const {
    data: payouts,
    total,
    isLoading,
    refetch,
  } = useFetchPaginated(
    `admin-finance-payouts-${statusFilter}`,
    FinanceServices.FetchPayouts(statusFilter ? { status: statusFilter } : {}) as unknown as IGeneric,
    page,
    pageSize
  )

  const { data: detailRaw, isLoading: detailLoading } = useFetchData(
    selectedPayoutId ? `admin-finance-payout-${selectedPayoutId}` : 'admin-finance-payout-none',
    (selectedPayoutId ? FinanceServices.FetchPayoutById(selectedPayoutId) : FinanceServices.FetchStats()) as unknown as IGeneric,
    !!selectedPayoutId
  )
  const detail = detailRaw as IPayout | null

  const {
    data: vendorPayouts,
    total: vendorTotal,
    isLoading: vendorLoading,
  } = useFetchPaginated(
    vendorId ? `admin-vendor-payouts-${vendorId}` : 'admin-vendor-payouts-none',
    (vendorId ? FinanceServices.FetchVendorPayouts(vendorId) : FinanceServices.FetchStats()) as unknown as IGeneric,
    vendorPage,
    vendorPageSize,
    !!vendorId && vendorSheetOpen
  )

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openDetail = (id: number) => {
    setSelectedPayoutId(id)
    setSheetOpen(true)
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setSelectedPayoutId(null)
  }

  const openVendorSheet = (id: number, name: string) => {
    setVendorId(id)
    setVendorName(name)
    setVendorPage(0)
    setVendorSheetOpen(true)
  }

  const closeVendorSheet = () => {
    setVendorSheetOpen(false)
    setVendorId(null)
  }

  const handleRetry = async () => {
    if (!selectedPayoutId) return
    setIsRetrying(true)
    try {
      await request(FinanceServices.RetryPayout(selectedPayoutId) as any)
      toast.success('Payout retry triggered successfully')
      closeSheet()
      refetch()
      queryClient.invalidateQueries({ queryKey: ['admin-finance-stats'] })
    } catch {
      toast.error('Failed to retry payout')
    } finally {
      setIsRetrying(false)
    }
  }

  // ── Grid columns ──────────────────────────────────────────────────────────

  const columns: any[] = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        width: 75,
        cellStyle: { color: '#6b7280', fontSize: '12px' },
      },
      {
        field: 'lotTitle',
        headerName: 'Lot',
        flex: 1,
        minWidth: 180,
        cellStyle: { fontWeight: '500', color: '#1c1917' },
      },
      {
        field: 'vendorName',
        headerName: 'Vendor',
        width: 140,
        valueFormatter: (p: any) => p.value ?? '—',
        cellStyle: { color: '#374151', fontSize: '13px' },
      },
      {
        field: 'grossAmount',
        headerName: 'Gross',
        width: 120,
        valueFormatter: (p: any) => fmtMoney(p.value ?? 0),
        cellStyle: { color: '#1c1917', fontWeight: '500', fontSize: '13px' },
      },
      {
        field: 'platformCharge',
        headerName: 'Fee',
        width: 110,
        valueFormatter: (p: any) => fmtMoney(p.value ?? 0),
        cellStyle: { color: '#ef4444', fontSize: '13px' },
      },
      {
        field: 'transferAmount',
        headerName: 'Net Transfer',
        width: 130,
        valueFormatter: (p: any) => fmtMoney(p.value ?? 0),
        cellStyle: { color: '#059669', fontWeight: '600', fontSize: '13px' },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 155,
        cellRenderer: ({ value }: any) => <StatusBadge status={value as PayoutStatus} />,
      },
      {
        field: 'createdAt',
        headerName: 'Date',
        width: 130,
        valueFormatter: (p: any) => (p.value ? fmtDate(p.value) : '—'),
        cellStyle: { color: '#9ca3af', fontSize: '12px' },
      },
      {
        field: 'view',
        headerName: '',
        width: 90,
        pinned: 'right' as const,
        sortable: false,
        filter: false,
        cellRenderer: ({ data: row }: any) => {
          if (!row) return null
          return (
            <button
              onClick={() => openDetail(row.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-endeavour/10 text-endeavour text-xs font-semibold hover:bg-endeavour/20 transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> View
            </button>
          )
        },
      },
    ],
    []
  )

  const vendorColumns: any[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 75, cellStyle: { color: '#6b7280', fontSize: '12px' } },
      {
        field: 'lotTitle',
        headerName: 'Lot',
        flex: 1,
        minWidth: 160,
        cellStyle: { fontWeight: '500', color: '#1c1917' },
      },
      {
        field: 'grossAmount',
        headerName: 'Gross',
        width: 120,
        valueFormatter: (p: any) => fmtMoney(p.value ?? 0),
        cellStyle: { color: '#1c1917', fontWeight: '500', fontSize: '13px' },
      },
      {
        field: 'transferAmount',
        headerName: 'Net',
        width: 120,
        valueFormatter: (p: any) => fmtMoney(p.value ?? 0),
        cellStyle: { color: '#059669', fontWeight: '600', fontSize: '13px' },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 145,
        cellRenderer: ({ value }: any) => <StatusBadge status={value as PayoutStatus} />,
      },
      {
        field: 'createdAt',
        headerName: 'Date',
        width: 120,
        valueFormatter: (p: any) => (p.value ? fmtDate(p.value) : '—'),
        cellStyle: { color: '#9ca3af', fontSize: '12px' },
      },
    ],
    []
  )

  const isRetryable = detail && RETRYABLE.includes(detail.status)

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="w-full flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800 tracking-tight">Finance & Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">Track platform revenue, fees, and vendor payout status</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs text-gray-500 self-start shrink-0">
          <ArrowRightLeft className="h-3.5 w-3.5 text-endeavour" />
          <span className="font-semibold text-stone-700">{stats?.totalPayouts ?? 0}</span>
          <span>total payouts</span>
        </div>
      </header>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Volume"
          value={stats ? fmtMoney(stats.totalVolume) : '—'}
          sub="Gross amount across all payouts"
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Platform Fees"
          value={stats ? fmtMoney(stats.totalPlatformFees) : '—'}
          sub="Revenue retained by platform"
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={ArrowRightLeft}
          label="Net Transferred"
          value={stats ? fmtMoney(stats.totalTransferred) : '—'}
          sub="Amount sent to vendors"
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={LayoutList}
          label="Payout Breakdown"
          value={stats?.totalPayouts ?? 0}
          sub={
            stats ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">{stats.successfulPayouts}</span> completed
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-400" />
                  <span className="text-red-500 font-semibold">{stats.failedPayouts}</span> failed
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span className="text-amber-600 font-semibold">{stats.pendingReview}</span> pending
                </span>
              </div>
            ) : null
          }
          color="bg-gray-100 text-gray-600"
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-medium">Status:</span>
          </div>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value)
                setPage(0)
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === f.value
                  ? (STATUS_META[f.value as PayoutStatus]?.pill ?? 'bg-stone-800 text-white')
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 sm:ml-auto">
          <span className="font-semibold text-stone-700">{total}</span> results
        </div>
      </div>

      {/* Payouts grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <DatagridTemplate
            columns={columns}
            data={(payouts as IPayout[]) ?? []}
            enablePagination={false}
            paginationPageSize={pageSize}
            selectionType="singleRow"
            loadingIndicator={isLoading}
            containerHeight={480}
            enableCheckboxes={false}
          />
        </div>
        <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Payout Detail Sheet */}
      <SheetTemplate
        open={sheetOpen}
        title={`Payout #${selectedPayoutId ?? ''}`}
        headerRightText={detail ? STATUS_META[detail.status]?.label : undefined}
        handleClose={closeSheet}
        contentClassName="md:min-w-[580px]"
        contentBodyClassName="flex flex-col gap-0 p-0"
        content={
          detailLoading ? (
            <div className="flex flex-col gap-3 p-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl" />
              ))}
            </div>
          ) : detail ? (
            <div className="flex flex-col flex-1 overflow-y-auto">
              {/* Status + IDs */}
              <div className="p-4 sm:p-5 bg-gray-50/80 border-b border-gray-100 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Status</p>
                    <div className="mt-1.5">
                      <StatusBadge status={detail.status} />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Created</p>
                    <p className="text-sm font-semibold text-stone-800 mt-1">{fmtDate(detail.createdAt)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Lot</p>
                    <p className="text-sm font-bold text-stone-800 mt-1 leading-snug">{detail.lotTitle}</p>
                    <p className="text-xs text-gray-400">ID #{detail.lotId}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Vendor</p>
                    <p className="text-sm font-semibold text-stone-800 mt-1">{detail.vendorName ?? `#${detail.vendorId}`}</p>
                    <p className="text-xs text-gray-400">ID #{detail.vendorId}</p>
                  </div>
                </div>

                {/* Amount breakdown */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount Breakdown</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-gray-500">Gross Amount</span>
                      <span className="text-sm font-semibold text-stone-800">{fmtMoney(detail.grossAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-red-500">Platform Fee</span>
                      <span className="text-sm font-semibold text-red-500">−{fmtMoney(detail.platformCharge)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-emerald-50/50">
                      <span className="text-sm font-bold text-emerald-700">Net Transfer</span>
                      <span className="text-base font-bold text-emerald-700">{fmtMoney(detail.transferAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Reference */}
                {detail.moolreReference && (
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Moolre Reference</p>
                    <p className="text-sm font-mono font-semibold text-stone-700 mt-1">{detail.moolreReference}</p>
                  </div>
                )}

                {/* Failure reason */}
                {detail.failureReason && (
                  <div className="bg-red-50 rounded-xl p-3 border border-red-100 flex gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-600">Failure Reason</p>
                      <p className="text-sm text-red-700 mt-0.5">{detail.failureReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                {/* View vendor payouts */}
                <button
                  onClick={() => openVendorSheet(detail.vendorId, detail.vendorName ?? `Vendor #${detail.vendorId}`)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-endeavour hover:bg-endeavour/5 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-gray-400 group-hover:text-endeavour transition-colors" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-stone-700 group-hover:text-endeavour transition-colors">
                        View Vendor Payouts
                      </p>
                      <p className="text-xs text-gray-400">All payouts for {detail.vendorName ?? `Vendor #${detail.vendorId}`}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-endeavour transition-colors" />
                </button>

                {/* Retry */}
                {isRetryable && (
                  <button
                    disabled={isRetrying}
                    onClick={handleRetry}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-endeavour text-white text-sm font-bold hover:bg-veniceBlue disabled:opacity-50 transition-colors shadow-sm shadow-endeavour/20"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                    {isRetrying ? 'Retrying...' : 'Retry Payout'}
                  </button>
                )}

                {!isRetryable && (
                  <div className="flex items-center gap-2 justify-center py-2 text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-medium text-gray-500">
                      This payout has been {STATUS_META[detail.status]?.label.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Payout not found</p>
            </div>
          )
        }
      />

      {/* Vendor Payouts Sheet */}
      <SheetTemplate
        open={vendorSheetOpen}
        title={vendorName}
        headerRightText="Vendor Payouts"
        handleClose={closeVendorSheet}
        contentClassName="md:min-w-[700px]"
        contentBodyClassName="flex flex-col gap-0 p-0"
        content={
          <div className="flex flex-col flex-1 overflow-hidden p-3 sm:p-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <DatagridTemplate
                  columns={vendorColumns}
                  data={(vendorPayouts as IPayout[]) ?? []}
                  enablePagination={false}
                  paginationPageSize={vendorPageSize}
                  selectionType="singleRow"
                  loadingIndicator={vendorLoading}
                  containerHeight={420}
                  enableCheckboxes={false}
                />
              </div>
              <Pagination
                page={vendorPage}
                pageSize={vendorPageSize}
                total={vendorTotal}
                onPage={setVendorPage}
                onPageSize={setVendorPageSize}
                label="vendor payouts"
              />
            </div>
          </div>
        }
      />
    </main>
  )
}

export default Main
