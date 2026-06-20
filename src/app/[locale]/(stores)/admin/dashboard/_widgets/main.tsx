'use client'

import React, { useMemo } from 'react'
import { Users, Gavel, Activity, TrendingUp, DollarSign, AlertCircle, Clock, MessageSquare, ArrowRight } from 'lucide-react'
import { AgCharts } from 'ag-charts-react'
import { AgChartOptions } from 'ag-charts-community'
import { useFetchData } from '@/hooks/use-fetch'
import { IGeneric } from '@/types/interfaces'
import { IAnalytics, IAuction, IDispute } from '@/types/interfaces/gems-bid'
import { AnalyticsServices } from '../_logics/services'
import { AuctionServices } from '../../auctions/_logics/services'
import { DisputeServices } from '../../disputes/_logics/services'

const fmt = (v: number) =>
  `GHS ${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const AuctionMiniRow = ({ auction }: { auction: IAuction }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50/60 rounded-xl transition-colors group cursor-pointer">
    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
      <Gavel className="h-3.5 w-3.5 text-amber-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-stone-800 truncate">{auction.title}</p>
      <p className="text-xs text-gray-400 mt-0.5">Vendor #{auction.vendorId} · {auction.lotCount ?? 0} lots</p>
    </div>
    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
  </div>
)

const DisputeMiniRow = ({ dispute }: { dispute: IDispute }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-red-50/60 rounded-xl transition-colors group cursor-pointer">
    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
      <MessageSquare className="h-3.5 w-3.5 text-red-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-stone-800 truncate">{dispute.reason}</p>
      <p className="text-xs text-gray-400 mt-0.5">Lot #{dispute.lotId} · Buyer #{dispute.buyerId}</p>
    </div>
    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-red-400 transition-colors flex-shrink-0" />
  </div>
)

const KPI_ITEMS = (analytics: IAnalytics.Response | undefined) => [
  {
    label: 'Total Revenue',
    value: fmt(analytics?.totalRevenue ?? 0),
    icon: DollarSign,
    iconBg: 'rgba(232,146,10,0.18)',
    iconColor: '#E8920A',
    alert: false,
  },
  {
    label: 'Active Auctions',
    value: (analytics?.activeAuctions ?? 0).toLocaleString(),
    icon: Activity,
    iconBg: 'rgba(52,211,153,0.15)',
    iconColor: '#34D399',
    alert: false,
  },
  {
    label: 'Bids Today',
    value: (analytics?.totalBidsToday ?? 0).toLocaleString(),
    icon: TrendingUp,
    iconBg: 'rgba(96,165,250,0.15)',
    iconColor: '#60A5FA',
    alert: false,
  },
  {
    label: 'Total Users',
    value: (analytics?.totalUsers ?? 0).toLocaleString(),
    icon: Users,
    iconBg: 'rgba(255,255,255,0.08)',
    iconColor: 'rgba(255,255,255,0.5)',
    alert: false,
  },
  {
    label: 'Total Auctions',
    value: (analytics?.totalAuctions ?? 0).toLocaleString(),
    icon: Gavel,
    iconBg: 'rgba(255,255,255,0.08)',
    iconColor: 'rgba(255,255,255,0.5)',
    alert: false,
  },
  {
    label: 'Open Disputes',
    value: (analytics?.openDisputes ?? 0).toLocaleString(),
    icon: AlertCircle,
    iconBg: (analytics?.openDisputes ?? 0) > 0 ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.08)',
    iconColor: (analytics?.openDisputes ?? 0) > 0 ? '#F87171' : 'rgba(255,255,255,0.5)',
    alert: (analytics?.openDisputes ?? 0) > 0,
  },
]

const Main = () => {
  const { data: analyticsRaw, isLoading } = useFetchData(
    'admin-analytics',
    AnalyticsServices.FetchAll() as unknown as IGeneric
  )
  const analytics = analyticsRaw as IAnalytics.Response | undefined

  const { data: pendingAuctionsRaw } = useFetchData(
    'dash-pending-auctions',
    AuctionServices.FetchAll({ status: 'pending_review', limit: 5 }) as unknown as IGeneric
  )
  const pendingAuctions = (pendingAuctionsRaw as IAuction[]) ?? []

  const { data: openDisputesRaw } = useFetchData(
    'dash-open-disputes',
    DisputeServices.FetchAll({ status: 'open', limit: 5 }) as unknown as IGeneric
  )
  const openDisputes = (openDisputesRaw as IDispute[]) ?? []

  const kpiItems = useMemo(() => KPI_ITEMS(analytics), [analytics])

  const barOptions: AgChartOptions = useMemo(
    () => ({
      data: [
        { metric: 'Active Auctions', value: analytics?.activeAuctions ?? 0 },
        { metric: 'Bids Today', value: analytics?.totalBidsToday ?? 0 },
        { metric: 'Open Disputes', value: analytics?.openDisputes ?? 0 },
        { metric: 'Total Users', value: analytics?.totalUsers ?? 0 },
      ],
      series: [
        {
          type: 'bar' as const,
          xKey: 'metric',
          yKey: 'value',
          yName: 'Count',
          fill: '#0865AC',
          strokeWidth: 0,
          cornerRadius: 6,
        },
      ],
      axes: [
        {
          type: 'category' as const,
          position: 'bottom' as const,
          label: { fontSize: 11, color: '#6b7280' },
          line: { enabled: false },
        },
        {
          type: 'number' as const,
          position: 'left' as const,
          label: { fontSize: 11, color: '#6b7280' },
          gridLine: { style: [{ stroke: '#f3f4f6', lineDash: [3, 3] }] },
        },
      ],
      background: { fill: 'transparent' },
      legend: { enabled: false },
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
    }),
    [analytics]
  )

  const pieOptions: AgChartOptions = useMemo(() => {
    const active = analytics?.activeAuctions ?? 0
    const total = analytics?.totalAuctions ?? 0
    const inactive = Math.max(0, total - active)
    return {
      data: [
        { status: 'Active', count: active === 0 && inactive === 0 ? 0.001 : active },
        { status: 'Inactive / Ended', count: inactive === 0 && active === 0 ? 0.001 : inactive },
      ],
      series: [
        {
          type: 'pie' as const,
          angleKey: 'count',
          calloutLabelKey: 'status',
          fills: ['#0865AC', '#e5e7eb'],
          strokes: ['#fff'],
          strokeWidth: 2,
          calloutLabel: { enabled: false },
          sectorLabel: { enabled: false },
        },
      ],
      background: { fill: 'transparent' },
      legend: {
        position: 'bottom' as const,
        item: { label: { fontSize: 11, color: '#6b7280' } },
      },
      padding: { top: 0, right: 8, bottom: 0, left: 8 },
    }
  }, [analytics])

  return (
    <main className="w-full flex flex-col gap-6">

      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's what's happening on Gems.Bid</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live data
        </div>
      </header>

      {/* ── Navy KPI Strip ── */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #0D1E36 0%, #152C4E 100%)',
          boxShadow: '0 6px 28px rgba(13,30,54,.38)',
          borderBottom: '2px solid #C97A10',
        }}
      >
        {/* Ambient radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 12% 50%, rgba(232,146,10,.07) 0%, transparent 50%), radial-gradient(ellipse at 88% 50%, rgba(15,94,172,.10) 0%, transparent 50%)',
          }}
        />

        {/* 1px gap grid — the gap shows through as a white/6 divider line */}
        <div
          className="relative grid grid-cols-2 md:grid-cols-3 gap-px"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          {kpiItems.map((item) => (
            <div
              key={item.label}
              className="px-5 py-5"
              style={{ background: '#0D1E36' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: item.iconBg }}
              >
                <item.icon className="h-4 w-4" style={{ color: item.iconColor }} />
              </div>
              <p
                className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
                style={{ color: 'rgba(255,255,255,0.38)' }}
              >
                {item.label}
              </p>
              {isLoading ? (
                <div
                  className="h-7 w-24 rounded-lg animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.10)' }}
                />
              ) : (
                <p
                  className="text-xl font-extrabold text-white leading-none tracking-tight"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {item.value}
                </p>
              )}
              {item.alert && (
                <p
                  className="text-[10px] font-bold tracking-wide uppercase mt-1.5"
                  style={{ color: '#F87171' }}
                >
                  Action needed
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <p className="font-semibold text-stone-800">Platform Activity</p>
            <p className="text-xs text-gray-400 mt-0.5">Key operational metrics at a glance</p>
          </div>
          {isLoading ? (
            <div className="h-52 animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl" />
          ) : (
            <AgCharts options={barOptions} style={{ height: '210px' }} />
          )}
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-3">
            <p className="font-semibold text-stone-800">Auction Health</p>
            <p className="text-xs text-gray-400 mt-0.5">Active vs inactive</p>
          </div>
          {isLoading ? (
            <div className="h-52 animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl" />
          ) : (
            <>
              <AgCharts options={pieOptions} style={{ height: '160px' }} />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-endeavour">{analytics?.activeAuctions ?? 0}</p>
                  <p className="text-xs text-endeavour/70 mt-0.5">Active</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-gray-500">
                    {Math.max(0, (analytics?.totalAuctions ?? 0) - (analytics?.activeAuctions ?? 0))}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Inactive</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Auctions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <p className="font-semibold text-stone-800 text-sm">Pending Review</p>
              {pendingAuctions.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  {pendingAuctions.length}
                </span>
              )}
            </div>
            <a
              href="/en/admin/auctions"
              className="text-xs text-endeavour hover:text-veniceBlue font-semibold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="p-2">
            {pendingAuctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                  <Gavel className="h-4 w-4 opacity-40" />
                </div>
                <p className="text-sm font-medium">No pending auctions</p>
                <p className="text-xs mt-1 text-gray-300">All caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {pendingAuctions.map((a: IAuction) => (
                  <AuctionMiniRow key={a.id} auction={a} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Open Disputes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              </div>
              <p className="font-semibold text-stone-800 text-sm">Open Disputes</p>
              {openDisputes.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  {openDisputes.length}
                </span>
              )}
            </div>
            <a
              href="/en/admin/disputes"
              className="text-xs text-endeavour hover:text-veniceBlue font-semibold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="p-2">
            {openDisputes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                  <MessageSquare className="h-4 w-4 opacity-40" />
                </div>
                <p className="text-sm font-medium">No open disputes</p>
                <p className="text-xs mt-1 text-gray-300">All caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {openDisputes.map((d: IDispute) => (
                  <DisputeMiniRow key={d.id} dispute={d} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Main
