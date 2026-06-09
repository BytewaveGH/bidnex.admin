'use client'

import React, { useMemo, useState } from 'react'
import {
  ArrowLeft, MapPin, Calendar, Star, CheckCircle, XCircle, X, Ban,
  Plus, Trash2, Clock, Package, Search, Tag, AlertCircle, Edit2,
  ChevronDown, ChevronUp, List, LayoutGrid, RefreshCw,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SheetTemplate } from '@/components/templates/sheet'
import { useFetchData } from '@/hooks/use-fetch'
import { useAxios } from '@/hooks/use-axios'
import { useCountdown } from '@/hooks/use-countdown'
import { IGeneric } from '@/types/interfaces'
import { IAuction, AuctionStatus, ILot } from '@/types/interfaces/gems-bid'
import { AuctionServices } from '../../_logics/services'
import { LotServices } from '../../_logics/lot-services'
import { toast } from 'sonner'
import AuctionForm from '../../_widgets/_forms/auction-form'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AUCTION_STATUS_STYLES: Record<AuctionStatus, string> = {
  draft:          'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  active:         'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ended:          'bg-blue-50 text-blue-700 border border-blue-200',
  cancelled:      'bg-red-50 text-red-600 border border-red-200',
}

const LOT_BIDDING_STATUS_STYLES: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-600',
  active:    'bg-emerald-50 text-emerald-700',
  sold:      'bg-purple-50 text-purple-700',
  unsold:    'bg-orange-50 text-orange-600',
  cancelled: 'bg-red-50 text-red-600',
}

const AuctionStatusBadge = ({ status }: { status: AuctionStatus }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${AUCTION_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'}`}>
    {status.replace(/_/g, ' ')}
  </span>
)

const LotStatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${LOT_BIDDING_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'}`}>
    {status}
  </span>
)

const fmtDuration = (ms: number) => {
  const totalMin = Math.floor(ms / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`
}

// ─── Countdown ────────────────────────────────────────────────────────────────

const CountdownCell = ({ targetIso, fallbackIso }: { targetIso?: string; fallbackIso?: string }) => {
  const { display, diff } = useCountdown(targetIso ?? fallbackIso)
  if (!display) return <span className="text-xs text-gray-400">—</span>
  const colorClass = diff < 3_600_000 ? 'text-red-600' : diff < 21_600_000 ? 'text-amber-500' : 'text-stone-700'
  return <span className={`text-sm font-bold tabular-nums ${colorClass}`}>{display}</span>
}

// ─── Schedule Section ────────────────────────────────────────────────────────

const ScheduleSection = ({
  lots,
  schedStartTime,
  lotIntervalMinutes,
  isScheduling,
  onChangeStart,
  onChangeInterval,
  onSchedule,
}: {
  lots: ILot[]
  schedStartTime: string
  lotIntervalMinutes: number
  isScheduling: boolean
  onChangeStart: (v: string) => void
  onChangeInterval: (v: number) => void
  onSchedule: () => void
}) => {
  const lotCount = lots.length
  const intervalMs = lotIntervalMinutes * 60_000
  const totalMs = lotCount * intervalMs
  const canPreview = schedStartTime && lotIntervalMinutes >= 1

  const slots = useMemo(() => {
    if (!canPreview || lotCount === 0) return []
    return lots.map((lot, i) => {
      const start = new Date(schedStartTime).getTime() + i * intervalMs
      return {
        id: lot.id,
        order: lot.lotOrder ?? i + 1,
        title: lot.title,
        slotStart: new Date(start),
        slotEnd: new Date(start + intervalMs),
      }
    })
  }, [schedStartTime, lotIntervalMinutes, lots, intervalMs, canPreview, lotCount])

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
          <Calendar className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-stone-800">Schedule Auction</p>
          <p className="text-xs text-gray-500">
            Each assigned lot gets an equal bidding window — auction end is computed automatically
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" /> Start Time <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={schedStartTime}
            onChange={e => onChangeStart(e.target.value)}
            className="border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" /> Minutes Per Lot <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={lotIntervalMinutes}
            onChange={e => onChangeInterval(Math.max(1, Number(e.target.value)))}
            className="border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
          />
        </div>
      </div>

      {canPreview && lotCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col gap-3">
          {/* Summary stats */}
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Total Duration', value: fmtDuration(totalMs) },
              { label: 'Lots', value: String(lotCount) },
              { label: 'Per Lot', value: `${lotIntervalMinutes}m` },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="w-px h-8 bg-amber-200" />}
                <div className="flex flex-col">
                  <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">{s.label}</p>
                  <p className="text-sm font-bold text-amber-700">{s.value}</p>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Lot slots table */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">Lot Slots (Preview)</p>
            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
              {slots.map(slot => (
                <div key={slot.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-500 w-6 flex-shrink-0">#{slot.order}</span>
                  <span className="text-xs font-semibold text-stone-700 flex-1 min-w-0 truncate">{slot.title}</span>
                  <span className="text-xs tabular-nums text-amber-700 font-medium flex-shrink-0">
                    {fmtTime(slot.slotStart)} – {fmtTime(slot.slotEnd)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {canPreview && lotCount === 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Add lots first — each will get a {lotIntervalMinutes}-minute bidding window
          </p>
        </div>
      )}

      <button
        disabled={!schedStartTime || lotIntervalMinutes < 1 || isScheduling}
        onClick={onSchedule}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-40 transition-colors shadow-sm shadow-amber-200 w-fit"
      >
        <Clock className="h-4 w-4" />
        {isScheduling ? 'Scheduling...' : 'Apply Schedule'}
      </button>
    </div>
  )
}

// ─── Lot Card (grid view) ─────────────────────────────────────────────────────

const LotCard = ({
  lot,
  index,
  auctionEndTime,
  onRemove,
  isRemoving,
  canRemove,
}: {
  lot: ILot
  index: number
  auctionEndTime?: string
  onRemove: (id: number) => void
  isRemoving: boolean
  canRemove: boolean
}) => {
  const fmt = (v?: number) => v != null ? `GHS ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'
  const displayOrder = lot.lotOrder ?? index + 1

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative overflow-hidden">
        {lot.primaryImage ? (
          <img src={lot.primaryImage} alt={lot.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <Package className="h-9 w-9" />
            <span className="text-xs font-medium">No image</span>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          Lot #{displayOrder}
        </div>
        <div className="absolute top-2 right-2">
          <LotStatusBadge status={lot.status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-sm font-bold text-stone-800 leading-tight line-clamp-2">{lot.title}</h3>
          {lot.condition && (
            <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{lot.condition.replace(/_/g, ' ')}</p>
          )}
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Starting</p>
            <p className="text-sm font-bold text-stone-800 mt-0.5">{fmt(lot.startingBid)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2.5">
            <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">
              Current Bid{lot.currentBidCount ? ` (${lot.currentBidCount})` : ''}
            </p>
            <p className="text-sm font-bold text-blue-700 mt-0.5">{fmt(lot.currentBid)}</p>
          </div>
        </div>

        {/* Slot window */}
        {(lot.bidStartTime || lot.bidEndTime) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-amber-50 rounded-xl p-2.5">
              <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Opens</p>
              <p className="text-xs font-bold text-amber-700 mt-0.5 tabular-nums">
                {lot.bidStartTime
                  ? new Date(lot.bidStartTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-2.5">
              <p className="text-[10px] text-purple-500 font-medium uppercase tracking-wide">Closes</p>
              <p className="text-xs font-bold text-purple-700 mt-0.5 tabular-nums">
                {lot.bidEndTime
                  ? new Date(lot.bidEndTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Countdown */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
          <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Closes in</p>
            <CountdownCell targetIso={lot.bidEndTime} fallbackIso={auctionEndTime} />
          </div>
        </div>

        {canRemove && (
          <button
            onClick={() => onRemove(lot.id)}
            disabled={isRemoving}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-100 text-red-500 text-xs font-semibold hover:bg-red-50 hover:border-red-200 disabled:opacity-40 transition-colors mt-auto"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove from auction
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Lot Timeline Row (list view) ─────────────────────────────────────────────

const LotTimelineRow = ({
  lot,
  index,
  auctionEndTime,
  onRemove,
  isRemoving,
  canRemove,
}: {
  lot: ILot
  index: number
  auctionEndTime?: string
  onRemove: (id: number) => void
  isRemoving: boolean
  canRemove: boolean
}) => {
  const fmt = (v?: number) => v != null ? `GHS ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'
  const displayOrder = lot.lotOrder ?? index + 1
  const isActive = lot.status === 'active'

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-3.5 flex items-center gap-4 hover:shadow-md transition-shadow ${isActive ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'}`}>
      {/* Order + image */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {displayOrder}
        </div>
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {lot.primaryImage
            ? <img src={lot.primaryImage} alt={lot.title} className="w-full h-full object-cover" />
            : <Package className="h-5 w-5 text-gray-300" />
          }
        </div>
      </div>

      {/* Title + condition */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-stone-800 truncate">{lot.title}</p>
          <LotStatusBadge status={lot.status} />
        </div>
        {lot.condition && (
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{lot.condition.replace(/_/g, ' ')}</p>
        )}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-gray-500">
            Starting: <strong className="text-stone-700">{fmt(lot.startingBid)}</strong>
          </span>
          {lot.currentBid != null && (
            <span className="text-xs text-blue-600 font-semibold">
              Bid: {fmt(lot.currentBid)}{lot.currentBidCount ? ` (${lot.currentBidCount})` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Time slot */}
      {(lot.bidStartTime || lot.bidEndTime) ? (
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Slot</p>
          <p className="text-xs font-bold text-stone-700 tabular-nums">
            {lot.bidStartTime ? new Date(lot.bidStartTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'}
            {' – '}
            {lot.bidEndTime ? new Date(lot.bidEndTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'}
          </p>
          <CountdownCell targetIso={lot.bidEndTime} fallbackIso={auctionEndTime} />
        </div>
      ) : (
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Closes in</p>
          <CountdownCell targetIso={lot.bidEndTime} fallbackIso={auctionEndTime} />
        </div>
      )}

      {/* Remove */}
      {canRemove && (
        <button
          onClick={() => onRemove(lot.id)}
          disabled={isRemoving}
          className="flex-shrink-0 w-8 h-8 rounded-xl border border-red-100 text-red-400 flex items-center justify-center hover:bg-red-50 hover:border-red-200 disabled:opacity-40 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── Add Lots Sheet ───────────────────────────────────────────────────────────

const AddLotsContent = ({
  auctionId,
  onSuccess,
}: {
  auctionId: number
  onSuccess: () => void
}) => {
  const request = useAxios()
  const [lotSearch, setLotSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)

  const { data: availableLotsRaw, isLoading } = useFetchData(
    'available-lots-approved',
    LotServices.FetchApproved() as unknown as IGeneric,
  )
  const allLots = (availableLotsRaw as ILot[]) ?? []
  const filteredLots = lotSearch
    ? allLots.filter(l => l.title.toLowerCase().includes(lotSearch.toLowerCase()))
    : allLots

  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleAssign = async () => {
    if (selected.size === 0) return
    setIsAssigning(true)
    try {
      for (const lotId of Array.from(selected)) {
        await request(AuctionServices.AssignLot(auctionId, lotId) as any)
      }
      toast.success(`${selected.size} lot${selected.size > 1 ? 's' : ''} assigned`)
      setSelected(new Set())
      onSuccess()
    } catch {
      toast.error('Failed to assign lots')
    } finally {
      setIsAssigning(false)
    }
  }

  const fmt = (v: number) => `GHS ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-5 flex-1 overflow-hidden">
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          value={lotSearch}
          onChange={e => setLotSearch(e.target.value)}
          placeholder="Filter by title..."
          className="flex-1 bg-transparent text-sm text-stone-700 focus:outline-none placeholder-gray-400"
        />
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 text-xs text-endeavour font-semibold bg-blue-50 px-3 py-2 rounded-xl">
          <CheckCircle className="h-3.5 w-3.5" />
          {selected.size} lot{selected.size > 1 ? 's' : ''} selected
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {filteredLots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Package className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No available lots</p>
            <p className="text-xs mt-1 text-gray-300">
              {allLots.length === 0
                ? 'No approved lots — go to Vendor Lots to approve some'
                : 'No lots match your search'}
            </p>
          </div>
        ) : (
          filteredLots.map(lot => {
            const isSelected = selected.has(lot.id)
            return (
              <button
                key={lot.id}
                onClick={() => toggle(lot.id)}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-endeavour bg-endeavour/5 ring-1 ring-endeavour/20'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  isSelected ? 'border-endeavour bg-endeavour' : 'border-gray-300'
                }`}>
                  {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {lot.primaryImage && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={lot.primaryImage} alt={lot.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{lot.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {fmt(lot.startingBid)}
                      </span>
                      {lot.vendorId && (
                        <span className="text-xs text-gray-400">Vendor #{lot.vendorId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="border-t border-gray-100 pt-4 mt-auto">
        <button
          disabled={selected.size === 0 || isAssigning}
          onClick={handleAssign}
          className="w-full py-3 rounded-xl bg-endeavour text-white text-sm font-bold hover:bg-veniceBlue disabled:opacity-40 transition-colors shadow-sm shadow-endeavour/20"
        >
          {isAssigning
            ? 'Assigning...'
            : selected.size > 0
            ? `Assign ${selected.size} Lot${selected.size > 1 ? 's' : ''} to Auction`
            : 'Select lots to assign'}
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface MainProps {
  auctionId: number
  locale: string
}

const Main = ({ auctionId, locale }: MainProps) => {
  const router = useRouter()
  const request = useAxios()

  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [addLotsSheetOpen, setAddLotsSheetOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isActioning, setIsActioning] = useState(false)
  const [removingLotId, setRemovingLotId] = useState<number | null>(null)
  const [lotsView, setLotsView] = useState<'grid' | 'list'>('list')
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)

  const [schedStartTime, setSchedStartTime] = useState('')
  const [lotIntervalMinutes, setLotIntervalMinutes] = useState(10)
  const [isScheduling, setIsScheduling] = useState(false)

  const { data: auctionRaw, isLoading: auctionLoading, refetch: refetchAuction } = useFetchData(
    `auction-detail-${auctionId}`,
    AuctionServices.GetById(auctionId) as unknown as IGeneric,
  )
  const auction = auctionRaw as IAuction | undefined

  const { data: lotsRaw, isLoading: lotsLoading, refetch: refetchLots } = useFetchData(
    `auction-${auctionId}-lots`,
    AuctionServices.GetLots(auctionId) as unknown as IGeneric,
  )
  const lotsUnsorted = (lotsRaw as ILot[]) ?? []
  const lots = useMemo(
    () => [...lotsUnsorted].sort((a, b) => (a.lotOrder ?? 999) - (b.lotOrder ?? 999)),
    [lotsUnsorted],
  )

  const isScheduled = !!(auction?.lotInterval && auction.lotInterval > 0)
  const showScheduleSection = auction && ['draft', 'pending_review'].includes(auction.status)

  const handleApprove = async () => {
    if (!auction) return
    setIsActioning(true)
    try {
      await request(AuctionServices.Approve(auctionId) as any)
      toast.success('Auction approved')
      refetchAuction()
    } catch { toast.error('Failed to approve') } finally { setIsActioning(false) }
  }

  const handleCancel = async () => {
    if (!auction) return
    setIsActioning(true)
    try {
      await request(AuctionServices.Cancel(auctionId) as any)
      toast.success('Auction cancelled')
      refetchAuction()
    } catch { toast.error('Failed to cancel') } finally { setIsActioning(false) }
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return
    setIsActioning(true)
    try {
      await request(AuctionServices.Reject(auctionId, { reason: rejectReason }) as any)
      toast.success('Auction rejected')
      setRejectOpen(false)
      setRejectReason('')
      refetchAuction()
    } catch { toast.error('Failed to reject') } finally { setIsActioning(false) }
  }

  const handleSchedule = async () => {
    if (!schedStartTime || lotIntervalMinutes < 1) return
    setIsScheduling(true)
    try {
      await request(AuctionServices.Schedule(auctionId, {
        startTime: new Date(schedStartTime).toISOString(),
        lotIntervalMinutes,
      }) as any)
      toast.success('Auction scheduled')
      setShowRescheduleForm(false)
      refetchAuction()
      refetchLots()
    } catch { toast.error('Failed to schedule') } finally { setIsScheduling(false) }
  }

  const handleRemoveLot = async (lotId: number) => {
    setRemovingLotId(lotId)
    try {
      await request(AuctionServices.RemoveLot(auctionId, lotId) as any)
      toast.success('Lot removed')
      refetchLots()
    } catch { toast.error('Failed to remove lot') } finally { setRemovingLotId(null) }
  }

  const fmt = (v?: string | null) => v
    ? new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl ${className}`} />
  )

  return (
    <main className="w-full flex flex-col gap-5">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push(`/${locale}/admin/auctions`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-endeavour transition-colors mb-3 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Auctions
        </button>
        <div className="flex items-start justify-between gap-4">
          {auctionLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
                {auction?.title ?? `Auction #${auctionId}`}
              </h1>
              {auction?.status && <AuctionStatusBadge status={auction.status} />}
              {auction?.isFeatured && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      {auctionLoading ? (
        <Skeleton className="h-52" />
      ) : auction ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Left */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              {auction.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{auction.description}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Vendor</p>
                  <p className="text-sm font-bold text-stone-800 mt-1">#{auction.vendorId ?? '—'}</p>
                </div>
                {(auction.locationName || auction.locationAddress) && (
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location
                    </p>
                    <p className="text-sm font-semibold text-stone-800 mt-1">{auction.locationName ?? ''}</p>
                    {auction.locationAddress && <p className="text-xs text-gray-500">{auction.locationAddress}</p>}
                  </div>
                )}
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Starts
                  </p>
                  <p className="text-sm font-bold text-blue-800 mt-1">{fmt(auction.startTime)}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Ends
                  </p>
                  <p className="text-sm font-bold text-purple-800 mt-1">{fmt(auction.endTime)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Lots</p>
                  <p className="text-sm font-bold text-stone-800 mt-1">{lots.length}</p>
                </div>
                {isScheduled && (
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Per Lot
                    </p>
                    <p className="text-sm font-bold text-amber-700 mt-1">{auction.lotInterval}m</p>
                  </div>
                )}
              </div>

              {auction.rejectReason && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
                    <p className="text-sm text-red-600 mt-0.5">{auction.rejectReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex flex-col gap-2 flex-shrink-0 min-w-[130px]">
              <button
                onClick={() => setEditSheetOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-stone-700 hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
              {(auction.status === 'draft' || auction.status === 'pending_review') && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={isActioning}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {auction.status === 'draft' ? 'Activate' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setRejectOpen(true)}
                    disabled={isActioning}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </>
              )}
              {auction.status === 'active' && (
                <button
                  onClick={handleCancel}
                  disabled={isActioning}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  <Ban className="h-4 w-4" /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Current schedule summary (when already scheduled) */}
      {isScheduled && auction && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800">Schedule</p>
                <p className="text-xs text-gray-500">
                  {fmt(auction.startTime)} → {fmt(auction.endTime)} · {auction.lotInterval}m per lot · {lots.length} lot{lots.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {showScheduleSection && (
              <button
                onClick={() => setShowRescheduleForm(v => !v)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-stone-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {showRescheduleForm ? 'Cancel' : 'Reschedule'}
                {showRescheduleForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Schedule form — show if not yet scheduled, or if user toggled reschedule */}
      {showScheduleSection && (!isScheduled || showRescheduleForm) && (
        <ScheduleSection
          lots={lots}
          schedStartTime={schedStartTime}
          lotIntervalMinutes={lotIntervalMinutes}
          isScheduling={isScheduling}
          onChangeStart={setSchedStartTime}
          onChangeInterval={setLotIntervalMinutes}
          onSchedule={handleSchedule}
        />
      )}

      {/* Lots section */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-endeavour/10 flex items-center justify-center">
              <Tag className="h-4 w-4 text-endeavour" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-stone-800">
                  Lots
                  <span className="ml-2 text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {lots.length}
                  </span>
                </p>
                {auction?.status === 'active' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {auction?.status === 'active'
                  ? 'Auction is live — lots open sequentially'
                  : isScheduled
                  ? 'In scheduled order · each slot is live'
                  : 'Items in this auction'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setLotsView('list')}
                className={`p-1.5 rounded-lg transition-colors ${lotsView === 'list' ? 'bg-white shadow-sm text-stone-700' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLotsView('grid')}
                className={`p-1.5 rounded-lg transition-colors ${lotsView === 'grid' ? 'bg-white shadow-sm text-stone-700' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            {auction && ['draft', 'pending_review'].includes(auction.status) && (
              <button
                onClick={() => setAddLotsSheetOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-endeavour text-white text-sm font-semibold rounded-xl hover:bg-veniceBlue transition-colors shadow-sm shadow-endeavour/20"
              >
                <Plus className="h-4 w-4" /> Add Lots
              </button>
            )}
          </div>
        </div>

        {lotsLoading ? (
          <div className={lotsView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
            {[1, 2, 3].map(i => <Skeleton key={i} className={lotsView === 'grid' ? 'h-80' : 'h-20'} />)}
          </div>
        ) : lots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Package className="h-7 w-7 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-stone-700">No lots assigned yet</p>
              <p className="text-xs text-gray-400 mt-1">Assign approved lots to this auction</p>
            </div>
            <button
              onClick={() => setAddLotsSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-endeavour text-white text-sm font-semibold rounded-xl hover:bg-veniceBlue transition-colors mt-2"
            >
              <Plus className="h-4 w-4" /> Add Lots
            </button>
          </div>
        ) : lotsView === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lots.map((lot, i) => (
              <LotCard
                key={lot.id}
                lot={lot}
                index={i}
                auctionEndTime={auction?.endTime}
                onRemove={handleRemoveLot}
                isRemoving={removingLotId === lot.id}
                canRemove={!!auction && ['draft', 'pending_review'].includes(auction.status)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {lots.map((lot, i) => (
              <LotTimelineRow
                key={lot.id}
                lot={lot}
                index={i}
                auctionEndTime={auction?.endTime}
                onRemove={handleRemoveLot}
                isRemoving={removingLotId === lot.id}
                canRemove={!!auction && ['draft', 'pending_review'].includes(auction.status)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit auction sheet */}
      <SheetTemplate
        open={editSheetOpen}
        title="Edit Auction"
        headerRightText={auction?.title}
        handleClose={() => setEditSheetOpen(false)}
        contentClassName="md:min-w-[560px]"
        contentBodyClassName="p-5"
        content={
          <AuctionForm
            mode="update"
            auctionId={auctionId}
            initialData={auction}
            onSuccess={() => { setEditSheetOpen(false); refetchAuction() }}
          />
        }
      />

      {/* Add lots sheet */}
      <SheetTemplate
        open={addLotsSheetOpen}
        title="Add Lots to Auction"
        headerRightText="Select approved lots to assign"
        handleClose={() => setAddLotsSheetOpen(false)}
        contentClassName="md:min-w-[600px]"
        contentBodyClassName="flex flex-col p-0"
        content={
          <AddLotsContent
            auctionId={auctionId}
            onSuccess={() => { setAddLotsSheetOpen(false); refetchLots() }}
          />
        }
      />

      {/* Reject modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] flex flex-col gap-5 mx-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800">Reject Auction</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Vendor will see this reason</p>
                </div>
              </div>
              <button
                onClick={() => { setRejectOpen(false); setRejectReason('') }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-amber-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-600 font-medium">Auction</p>
              <p className="text-sm font-semibold text-stone-800 mt-0.5">{auction?.title}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Explain clearly why this auction is being rejected..."
                className="border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none placeholder-gray-400 transition-all"
                autoFocus
              />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => { setRejectOpen(false); setRejectReason('') }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
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
