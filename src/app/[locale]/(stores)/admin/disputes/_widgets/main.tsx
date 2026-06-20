'use client'

import React, { useMemo, useState } from 'react'

import { AlertCircle, MessageSquare, CheckCircle, Filter, ExternalLink } from 'lucide-react'
import DatagridTemplate from '@/components/templates/datagrid'
import { SheetTemplate } from '@/components/templates/sheet'
import { useFetchPaginated } from '@/hooks/use-fetch-paginated'
import { useFetchData } from '@/hooks/use-fetch'
import { useAxios } from '@/hooks/use-axios'
import { IGeneric } from '@/types/interfaces'
import { IDispute, DisputeStatus, DisputeResolutionStatus } from '@/types/interfaces/gems-bid'
import { DisputeServices } from '../_logics/services'
import { toast } from 'sonner'

const STATUS_META: Record<DisputeStatus, { label: string; badge: string; pill: string }> = {
  open: { label: 'Open', badge: 'bg-red-50 text-red-700 border border-red-200', pill: 'bg-red-500 text-white' },
  under_review: { label: 'Under Review', badge: 'bg-amber-50 text-amber-700 border border-amber-200', pill: 'bg-amber-500 text-white' },
  resolved_refund: { label: 'Refund', badge: 'bg-blue-50 text-blue-700 border border-blue-200', pill: 'bg-blue-500 text-white' },
  resolved_partial: {
    label: 'Partial Refund',
    badge: 'bg-purple-50 text-purple-700 border border-purple-200',
    pill: 'bg-purple-500 text-white',
  },
  resolved_store_credit: {
    label: 'Store Credit',
    badge: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    pill: 'bg-cyan-500 text-white',
  },
  resolved_no_action: { label: 'No Action', badge: 'bg-gray-100 text-gray-600', pill: 'bg-gray-500 text-white' },
  closed: { label: 'Closed', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', pill: 'bg-emerald-500 text-white' },
}

const STATUS_FILTERS: { label: string; value: DisputeStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Resolved', value: 'resolved_refund' },
  { label: 'Closed', value: 'closed' },
]

const DisputeStatusBadge = ({ status }: { status: DisputeStatus }) => {
  const meta = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta?.badge ?? 'bg-gray-100 text-gray-500'}`}
    >
      {meta?.label ?? status}
    </span>
  )
}

const RESOLUTION_OPTIONS: { label: string; value: DisputeResolutionStatus; description: string; color: string }[] = [
  { value: 'resolved_refund', label: 'Full Refund', description: 'Issue a full refund to the buyer', color: 'text-blue-700 bg-blue-50' },
  {
    value: 'resolved_partial',
    label: 'Partial Refund',
    description: 'Issue a partial refund to the buyer',
    color: 'text-purple-700 bg-purple-50',
  },
  {
    value: 'resolved_store_credit',
    label: 'Store Credit',
    description: 'Credit the buyer with store credit',
    color: 'text-cyan-700 bg-cyan-50',
  },
  {
    value: 'resolved_no_action',
    label: 'No Action',
    description: 'Dismiss the dispute with no action taken',
    color: 'text-gray-700 bg-gray-100',
  },
  { value: 'closed', label: 'Close Dispute', description: 'Close without formal resolution', color: 'text-emerald-700 bg-emerald-50' },
]

const RESOLVABLE: DisputeStatus[] = ['open', 'under_review']

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
      <span className="text-xs text-gray-500">{total > 0 ? `Showing ${from}–${to} of ${total} disputes` : 'No disputes found'}</span>
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

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | ''>('')
  const [selectedDisputeId, setSelectedDisputeId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [resolveStatus, setResolveStatus] = useState<DisputeResolutionStatus>('closed')
  const [resolveNote, setResolveNote] = useState('')
  const [isResolving, setIsResolving] = useState(false)

  const {
    data: disputes,
    total,
    isLoading,
    refetch,
  } = useFetchPaginated(
    `admin-disputes-${statusFilter}`,
    DisputeServices.FetchAll({ ...(statusFilter ? { status: statusFilter } : {}) }) as unknown as IGeneric,
    page,
    pageSize
  )

  const { data: detailRaw, isLoading: detailLoading } = useFetchData(
    selectedDisputeId ? `admin-dispute-${selectedDisputeId}` : 'admin-dispute-none',
    (selectedDisputeId ? DisputeServices.FetchById(selectedDisputeId) : DisputeServices.FetchAll()) as unknown as IGeneric,
    !!selectedDisputeId
  )
  const detail = detailRaw as IDispute | null

  const openDetail = (id: number) => {
    setSelectedDisputeId(id)
    setResolveStatus('closed')
    setResolveNote('')
    setSheetOpen(true)
  }

  const closeSheet = () => {
    setSheetOpen(false)
    setSelectedDisputeId(null)
  }

  const handleResolve = async () => {
    if (!selectedDisputeId) return
    setIsResolving(true)
    try {
      await request(
        DisputeServices.Resolve(selectedDisputeId, {
          status: resolveStatus,
          ...(resolveNote.trim() ? { outcomeNote: resolveNote.trim() } : {}),
        }) as any
      )
      toast.success('Dispute resolved successfully')
      closeSheet()
      refetch()
    } catch {
      toast.error('Failed to resolve dispute')
    } finally {
      setIsResolving(false)
    }
  }

  const columns: any[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 75, cellStyle: { color: '#6b7280', fontSize: '12px' } },
      {
        field: 'lotId',
        headerName: 'Lot',
        width: 85,
        valueFormatter: (p: any) => `#${p.value}`,
        cellStyle: { color: '#6b7280', fontSize: '13px' },
      },
      {
        field: 'buyerId',
        headerName: 'Buyer',
        width: 90,
        valueFormatter: (p: any) => `#${p.value}`,
        cellStyle: { color: '#6b7280', fontSize: '13px' },
      },
      {
        field: 'sellerId',
        headerName: 'Seller',
        width: 90,
        valueFormatter: (p: any) => `#${p.value}`,
        cellStyle: { color: '#6b7280', fontSize: '13px' },
      },
      {
        field: 'reason',
        headerName: 'Reason',
        flex: 1,
        minWidth: 180,
        cellStyle: { fontWeight: '500', color: '#1c1917' },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 155,
        cellRenderer: ({ value }: any) => <DisputeStatusBadge status={value} />,
      },
      {
        field: 'filedAt',
        headerName: 'Filed',
        width: 120,
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
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

  const isResolvable = detail && RESOLVABLE.includes(detail.status)
  const selectedResolution = RESOLUTION_OPTIONS.find((r) => r.value === resolveStatus)

  return (
    <main className="w-full flex flex-col gap-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Disputes</h1>
          <p className="text-sm text-gray-500 mt-1">Review and resolve buyer-seller disputes</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm text-xs text-gray-500">
          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
          <span className="font-semibold text-stone-700">{total}</span>
          <span>disputes</span>
        </div>
      </header>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2">
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
                ? (STATUS_META[f.value as DisputeStatus]?.pill ?? 'bg-stone-800 text-white')
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <DatagridTemplate
          columns={columns}
          data={(disputes as IDispute[]) ?? []}
          enablePagination={false}
          paginationPageSize={pageSize}
          selectionType="singleRow"
          loadingIndicator={isLoading}
          containerHeight={480}
          enableCheckboxes={false}
        />
        <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Dispute Detail Sheet */}
      <SheetTemplate
        open={sheetOpen}
        title={`Dispute #${selectedDisputeId ?? ''}`}
        headerRightText={detail ? STATUS_META[detail.status]?.label : undefined}
        handleClose={closeSheet}
        contentClassName="md:min-w-[600px]"
        contentBodyClassName="flex flex-col gap-0 p-0"
        content={
          detailLoading ? (
            <div className="flex flex-col gap-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl" />
              ))}
            </div>
          ) : detail ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Meta section */}
              <div className="p-5 bg-gray-50/80 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Status</p>
                    <div className="mt-1">
                      <DisputeStatusBadge status={detail.status} />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Lot</p>
                    <p className="text-sm font-bold text-stone-800 mt-1">#{detail.lotId}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Buyer ID</p>
                    <p className="text-sm font-semibold text-stone-800 mt-1">#{detail.buyerId}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium">Seller ID</p>
                    <p className="text-sm font-semibold text-stone-800 mt-1">#{detail.sellerId}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">Reason</p>
                  <p className="text-sm font-semibold text-stone-800 mt-1">{detail.reason}</p>
                  {detail.description && detail.description !== detail.reason && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{detail.description}</p>
                  )}
                </div>
                {detail.outcomeNote && (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mt-3">
                    <p className="text-xs text-emerald-600 font-semibold">Outcome Note</p>
                    <p className="text-sm text-emerald-800 mt-1">{detail.outcomeNote}</p>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-stone-700">Message Thread</p>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                    {detail.messages?.length ?? 0}
                  </span>
                </div>

                {!detail.messages || detail.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No messages in this dispute</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {detail.messages.map((msg) => {
                      const isBuyer = msg.senderId === detail.buyerId
                      return (
                        <div key={msg.id} className={`flex gap-2.5 ${isBuyer ? '' : 'flex-row-reverse'}`}>
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${
                              isBuyer ? 'bg-blue-500' : 'bg-purple-500'
                            }`}
                          >
                            {isBuyer ? 'B' : 'S'}
                          </div>
                          <div className={`flex-1 max-w-[85%] ${isBuyer ? '' : 'flex flex-col items-end'}`}>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm ${
                                isBuyer ? 'bg-blue-50 text-stone-800 rounded-tl-sm' : 'bg-purple-50 text-stone-800 rounded-tr-sm'
                              }`}
                            >
                              <p className={`text-xs font-semibold mb-1 ${isBuyer ? 'text-blue-600' : 'text-purple-600'}`}>
                                {isBuyer ? `Buyer #${msg.senderId}` : `Seller #${msg.senderId}`}
                              </p>
                              <p className="leading-relaxed">{msg.message}</p>
                              {msg.attachments?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {msg.attachments.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-endeavour hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" /> Attachment {i + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 px-1">
                              {new Date(msg.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Resolve section */}
              {isResolvable && (
                <div className="border-t border-gray-100 bg-white p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <p className="text-sm font-bold text-stone-800">Resolve Dispute</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setResolveStatus(opt.value)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                          resolveStatus === opt.value
                            ? `border-endeavour bg-endeavour/5 ring-1 ring-endeavour/20`
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${opt.color}`}>
                          {opt.value === resolveStatus ? '✓' : '○'}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${resolveStatus === opt.value ? 'text-endeavour' : 'text-stone-700'}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-stone-700">
                      Outcome Note <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      rows={3}
                      placeholder="Add context about your decision — this may be shown to both parties..."
                      className="border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour resize-none placeholder-gray-400 transition-all"
                    />
                  </div>

                  <button
                    disabled={isResolving}
                    onClick={handleResolve}
                    className="w-full py-3 rounded-xl bg-endeavour text-white text-sm font-bold hover:bg-veniceBlue disabled:opacity-50 transition-colors shadow-sm shadow-endeavour/20"
                  >
                    {isResolving ? 'Resolving...' : `Confirm — ${selectedResolution?.label ?? 'Resolve'}`}
                  </button>
                </div>
              )}

              {!isResolvable && (
                <div className="border-t border-gray-100 p-4">
                  <div className="flex items-center gap-2 justify-center py-2 text-gray-400">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-medium text-gray-500">This dispute has already been {detail.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <AlertCircle className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Dispute not found</p>
            </div>
          )
        }
      />
    </main>
  )
}

export default Main
