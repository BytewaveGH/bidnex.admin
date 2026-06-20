'use client'

import React, { useState } from 'react'
import { Package, CheckCircle, XCircle, X, Search, Tag, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { useFetchData } from '@/hooks/use-fetch'
import { useAxios } from '@/hooks/use-axios'
import { IGeneric } from '@/types/interfaces'
import { ILot, LotReviewStatus } from '@/types/interfaces/gems-bid'
import { LotServices } from '../../auctions/_logics/lot-services'
import { toast } from 'sonner'

// ─── Status config ────────────────────────────────────────────────────────────

type FilterReviewStatus = 'all' | LotReviewStatus

const REVIEW_STATUS_STYLES: Record<LotReviewStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border border-gray-200',
  submitted: 'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
}

const FILTER_TABS: { key: FilterReviewStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'submitted', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'draft', label: 'Draft' },
]

const LotReviewBadge = ({ status }: { status: LotReviewStatus }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${REVIEW_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'}`}
  >
    {status}
  </span>
)

// ─── Lot Row ─────────────────────────────────────────────────────────────────

const LotRow = ({
  lot,
  onApprove,
  onReject,
  isActioning,
}: {
  lot: ILot
  onApprove: (id: number) => void
  onReject: (lot: ILot) => void
  isActioning: boolean
}) => {
  const fmt = (v: number) => `GHS ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  const canAct = lot.reviewStatus === 'submitted'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
        {lot.primaryImage ? (
          <img src={lot.primaryImage} alt={lot.title} className="w-full h-full object-cover" />
        ) : (
          <Package className="h-6 w-6 text-gray-300" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-stone-800 truncate">{lot.title}</p>
              <LotReviewBadge status={lot.reviewStatus} />
              {lot.condition && (
                <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                  {lot.condition.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            {lot.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{lot.description}</p>}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-xs text-gray-500">
                Starting: <strong className="text-stone-700">{fmt(lot.startingBid)}</strong>
              </span>
              {lot.reservePrice && (
                <span className="text-xs text-gray-500">
                  Reserve: <strong className="text-stone-700">{fmt(lot.reservePrice)}</strong>
                </span>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Vendor {lot.vendorName ?? `#${lot.vendorId}`}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(lot.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
            {lot.reviewStatus === 'rejected' && lot.reviewRejectReason && (
              <div className="flex items-start gap-1.5 mt-2 bg-red-50 rounded-lg px-2.5 py-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{lot.reviewRejectReason}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {canAct && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onApprove(lot.id)}
                disabled={isActioning}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => onReject(lot)}
                disabled={isActioning}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Main = () => {
  const request = useAxios()

  const [activeFilter, setActiveFilter] = useState<FilterReviewStatus>('submitted')
  const [search, setSearch] = useState('')
  const [actioningId, setActioningId] = useState<number | null>(null)

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<ILot | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  const fetchParams = activeFilter === 'all' ? undefined : { reviewStatus: activeFilter }

  const {
    data: lotsRaw,
    isLoading,
    refetch,
  } = useFetchData(`admin-lots-${activeFilter}`, LotServices.FetchAll(fetchParams) as unknown as IGeneric)
  const lots = (lotsRaw as ILot[]) ?? []

  const filtered = search
    ? lots.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()) || String(l.vendorId).includes(search))
    : lots

  const submittedCount = lots.filter((l) => l.reviewStatus === 'submitted').length

  const handleApprove = async (id: number) => {
    setActioningId(id)
    try {
      await request(LotServices.Approve(id) as any)
      toast.success('Lot approved — it can now be assigned to an auction')
      refetch()
    } catch {
      toast.error('Failed to approve lot')
    } finally {
      setActioningId(null)
    }
  }

  const openReject = (lot: ILot) => {
    setRejectTarget(lot)
    setRejectReason('')
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setIsRejecting(true)
    try {
      await request(LotServices.Reject(rejectTarget.id, { reason: rejectReason }) as any)
      toast.success('Lot rejected')
      setRejectTarget(null)
      setRejectReason('')
      refetch()
    } catch {
      toast.error('Failed to reject lot')
    } finally {
      setIsRejecting(false)
    }
  }

  const Skeleton = () => <div className="animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl h-24" />

  return (
    <main className="w-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Vendor Lots</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve lots submitted by vendors before assigning them to auctions</p>
        </div>
        {submittedCount > 0 && activeFilter !== 'submitted' && (
          <button
            onClick={() => setActiveFilter('submitted')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            {submittedCount} pending review
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === tab.key ? 'bg-white text-stone-800 shadow-sm' : 'text-gray-500 hover:text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-xs">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lots or vendor ID..."
            className="bg-transparent text-sm text-stone-700 focus:outline-none placeholder-gray-400 flex-1"
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 font-medium -mt-2">
        {filtered.length} lot{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Package className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-stone-700">No lots found</p>
          <p className="text-xs text-gray-400">{search ? 'Try adjusting your search' : 'No lots match the selected status'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((lot) => (
            <LotRow key={lot.id} lot={lot} onApprove={handleApprove} onReject={openReject} isActioning={actioningId === lot.id} />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] flex flex-col gap-5 mx-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800">Reject Lot</h2>
                  <p className="text-xs text-gray-500 mt-0.5">The vendor will see this reason</p>
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
              <p className="text-xs text-amber-600 font-medium">Lot</p>
              <p className="text-sm font-semibold text-stone-800 mt-0.5">{rejectTarget.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">Vendor {rejectTarget.vendorName ?? `#${rejectTarget.vendorId}`}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Explain why this lot is being rejected..."
                className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none placeholder-gray-400 transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setRejectTarget(null)
                  setRejectReason('')
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={!rejectReason.trim() || isRejecting}
                onClick={handleRejectConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Main
