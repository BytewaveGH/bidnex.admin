'use client'

import React, { useMemo, useState } from 'react'
import { ColDef } from 'ag-grid-community'
import { Search, Gavel, CheckCircle, XCircle, X, Filter, Plus, Eye } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import DatagridTemplate from '@/components/templates/datagrid'
import { SheetTemplate } from '@/components/templates/sheet'
import { useFetchPaginated } from '@/hooks/use-fetch-paginated'
import { useAxios } from '@/hooks/use-axios'
import { IGeneric } from '@/types/interfaces'
import { IAuction, AuctionStatus } from '@/types/interfaces/gems-bid'
import { AuctionServices } from '../_logics/services'
import AuctionForm from './_forms/auction-form'
import { toast } from 'sonner'

const STATUS_FILTERS: { label: string; value: AuctionStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Active', value: 'active' },
  { label: 'Ended', value: 'ended' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Draft', value: 'draft' },
]

const STATUS_STYLES: Record<AuctionStatus, { badge: string; pill: string }> = {
  draft: { badge: 'bg-gray-100 text-gray-600', pill: 'bg-gray-800 text-white' },
  pending_review: { badge: 'bg-amber-50 text-amber-700 border border-amber-200', pill: 'bg-amber-500 text-white' },
  active: { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', pill: 'bg-emerald-500 text-white' },
  ended: { badge: 'bg-blue-50 text-blue-700 border border-blue-200', pill: 'bg-blue-500 text-white' },
  cancelled: { badge: 'bg-red-50 text-red-600 border border-red-200', pill: 'bg-red-500 text-white' },
}

const StatusBadge = ({ status }: { status: AuctionStatus }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status]?.badge ?? 'bg-gray-100 text-gray-500'}`}
  >
    {status.replace(/_/g, ' ')}
  </span>
)

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
      <span className="text-xs text-gray-500">{total > 0 ? `Showing ${from}–${to} of ${total} auctions` : 'No auctions found'}</span>
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

const Main = () => {
  const request = useAxios()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'en'

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<AuctionStatus | ''>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [rejectTarget, setRejectTarget] = useState<IAuction | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isActioning, setIsActioning] = useState(false)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  const queryKey = `admin-auctions-${statusFilter}-${search}`
  const {
    data: auctions,
    total,
    isLoading,
    refetch,
  } = useFetchPaginated(
    queryKey,
    AuctionServices.FetchAll({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    }) as unknown as IGeneric,
    page,
    pageSize
  )

  const handleApprove = async (auction: IAuction) => {
    try {
      await request(AuctionServices.Approve(auction.id) as any)
      toast.success(`"${auction.title}" approved`)
      refetch()
    } catch {
      toast.error('Failed to approve auction')
    }
  }

  const handleCancel = async (auction: IAuction) => {
    try {
      await request(AuctionServices.Cancel(auction.id) as any)
      toast.success(`"${auction.title}" cancelled`)
      refetch()
    } catch {
      toast.error('Failed to cancel auction')
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setIsActioning(true)
    try {
      await request(AuctionServices.Reject(rejectTarget.id, { reason: rejectReason }) as any)
      toast.success(`"${rejectTarget.title}" rejected`)
      setRejectTarget(null)
      setRejectReason('')
      refetch()
    } catch {
      toast.error('Failed to reject auction')
    } finally {
      setIsActioning(false)
    }
  }

  const columns: ColDef[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 75, cellStyle: { color: '#6b7280', fontSize: '12px' } },
      { field: 'title', headerName: 'Auction Title', flex: 1, minWidth: 180 },
      { field: 'vendorId', headerName: 'Vendor', width: 95, valueFormatter: (p: any) => `#${p.value ?? '—'}` },
      {
        field: 'status',
        headerName: 'Status',
        width: 155,
        cellRenderer: ({ value }: any) => <StatusBadge status={value} />,
      },
      { field: 'lotCount', headerName: 'Lots', width: 75, valueFormatter: (p: any) => p.value ?? '—' },
      {
        field: 'startTime',
        headerName: 'Starts',
        width: 155,
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—',
      },
      {
        field: 'endTime',
        headerName: 'Ends',
        width: 155,
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 230,
        pinned: 'right' as const,
        sortable: false,
        filter: false,
        cellRenderer: ({ data: row }: any) => {
          if (!row) return null
          return (
            <div className="flex items-center gap-1 h-full">
              <button
                onClick={() => router.push(`/${locale}/admin/auctions/${row.id}`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-stone-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                <Eye className="h-3 w-3" /> View
              </button>
              {(row.status === 'draft' || row.status === 'pending_review') && (
                <>
                  <button
                    onClick={() => handleApprove(row)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle className="h-3 w-3" />
                    {row.status === 'draft' ? 'Activate' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setRejectTarget(row)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="h-3 w-3" /> Reject
                  </button>
                </>
              )}
              {row.status === 'active' && (
                <button
                  onClick={() => handleCancel(row)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100 transition-colors"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [locale]
  )

  const activeFilterLabel = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label

  return (
    <main className="w-full flex flex-col gap-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Auctions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, create, and moderate platform auctions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-2 text-xs text-gray-500">
            <Gavel className="h-3.5 w-3.5 text-endeavour" />
            <span className="font-semibold text-stone-700">{total}</span>
            <span>{activeFilterLabel === 'All' ? 'total' : activeFilterLabel?.toLowerCase()}</span>
          </div>
          <button
            onClick={() => setCreateSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-endeavour text-white text-sm font-semibold rounded-xl hover:bg-veniceBlue transition-colors shadow-sm shadow-endeavour/20 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            New Auction
          </button>
        </div>
      </header>

      {/* Filter & Search — single bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Status:</span>
        </div>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(0) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === f.value
                ? (STATUS_STYLES[f.value as AuctionStatus]?.pill ?? 'bg-stone-800 text-white')
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 min-w-[200px]">
          <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0) } }}
            placeholder="Search auctions…"
            className="flex-1 bg-transparent text-sm text-stone-700 focus:outline-none placeholder-gray-400"
          />
          {searchInput && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }} className="text-gray-400 hover:text-red-400 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <DatagridTemplate
          columns={columns}
          data={(auctions as IAuction[]) ?? []}
          enablePagination={false}
          paginationPageSize={pageSize}
          selectionType="singleRow"
          loadingIndicator={isLoading}
          containerHeight={480}
          enableCheckboxes={false}
        />
        <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Create Auction Sheet */}
      <SheetTemplate
        open={createSheetOpen}
        title="Create New Auction"
        headerRightText="Set up a new auction from scratch"
        handleClose={() => setCreateSheetOpen(false)}
        contentClassName="md:min-w-[560px]"
        contentBodyClassName="p-5"
        content={
          <AuctionForm
            mode="create"
            onSuccess={() => {
              setCreateSheetOpen(false)
              refetch()
            }}
          />
        }
      />

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] flex flex-col gap-5 mx-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800">Reject Auction</h2>
                  <p className="text-xs text-gray-500 mt-0.5">This reason will be visible to the vendor</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setRejectTarget(null)
                  setRejectReason('')
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-amber-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-600 font-medium">Auction</p>
              <p className="text-sm font-semibold text-stone-800 mt-0.5">{rejectTarget.title}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Rejection Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Explain clearly why this auction is being rejected..."
                className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none placeholder-gray-400 transition-all"
                autoFocus
              />
              <p className="text-xs text-gray-400">{rejectReason.length} characters</p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  setRejectTarget(null)
                  setRejectReason('')
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!rejectReason.trim() || isActioning}
                onClick={handleRejectConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {isActioning ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Main
