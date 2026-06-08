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

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl ${className}`} />
)

const KPICard = ({
  label,
  value,
  icon: Icon,
  gradient,
  note,
  highlight = false,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  gradient: string
  note?: string
  highlight?: boolean
}) => (
  <div
    className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200 ${
      highlight ? 'border-red-200 shadow-red-50/50' : 'border-gray-100'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${gradient}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      {note && (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          highlight ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
        }`}>
          {note}
        </span>
      )}
    </div>
    <div>
      <p className="text-[1.75rem] font-bold text-stone-800 leading-none tracking-tight">{value}</p>
      <p className="text-sm text-gray-500 mt-2 font-medium">{label}</p>
    </div>
  </div>
)

const AuctionMiniRow = ({ auction }: { auction: IAuction }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50/60 rounded-xl transition-colors group cursor-pointer">
    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
      <Gavel className="h-4 w-4 text-amber-600" />
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
    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
      <MessageSquare className="h-4 w-4 text-red-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-stone-800 truncate">{dispute.reason}</p>
      <p className="text-xs text-gray-400 mt-0.5">Lot #{dispute.lotId} · Buyer #{dispute.buyerId}</p>
    </div>
    <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-red-400 transition-colors flex-shrink-0" />
  </div>
)

const fmt = (v: number) =>
  `GHS ${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const Main = () => {
  const { data: analyticsRaw, isLoading } = useFetchData(
    'admin-analytics',
    AnalyticsServices.FetchAll() as unknown as IGeneric,
  )
  const analytics = analyticsRaw as IAnalytics.Response | undefined

  const { data: pendingAuctionsRaw } = useFetchData(
    'dash-pending-auctions',
    AuctionServices.FetchAll({ status: 'pending_review', limit: 5 }) as unknown as IGeneric,
  )
  const pendingAuctions = (pendingAuctionsRaw as IAuction[]) ?? []

  const { data: openDisputesRaw } = useFetchData(
    'dash-open-disputes',
    DisputeServices.FetchAll({ status: 'open', limit: 5 }) as unknown as IGeneric,
  )
  const openDisputes = (openDisputesRaw as IDispute[]) ?? []

  const barOptions: AgChartOptions = useMemo(() => ({
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
  }), [analytics])

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
          fills: ['#10b981', '#e5e7eb'],
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
          <p className="text-sm text-gray-500 mt-1">Welcome back — here's what's happening on Gems.Bid</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span>Live data</span>
        </div>
      </header>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard
            label="Total Users"
            value={(analytics?.totalUsers ?? 0).toLocaleString()}
            icon={Users}
            gradient="bg-gradient-to-br from-endeavour to-veniceBlue"
            note="All time"
          />
          <KPICard
            label="Total Auctions"
            value={(analytics?.totalAuctions ?? 0).toLocaleString()}
            icon={Gavel}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <KPICard
            label="Active Auctions"
            value={(analytics?.activeAuctions ?? 0).toLocaleString()}
            icon={Activity}
            gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          />
          <KPICard
            label="Bids Today"
            value={(analytics?.totalBidsToday ?? 0).toLocaleString()}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          />
          <KPICard
            label="Total Revenue"
            value={fmt(analytics?.totalRevenue ?? 0)}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <KPICard
            label="Open Disputes"
            value={(analytics?.openDisputes ?? 0).toLocaleString()}
            icon={AlertCircle}
            gradient={
              (analytics?.openDisputes ?? 0) > 0
                ? 'bg-gradient-to-br from-red-500 to-rose-600'
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }
            highlight={(analytics?.openDisputes ?? 0) > 0}
            note={(analytics?.openDisputes ?? 0) > 0 ? 'Action needed' : undefined}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Bar chart */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-5">
            <p className="font-semibold text-stone-800">Platform Activity</p>
            <p className="text-xs text-gray-400 mt-0.5">Key operational metrics at a glance</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <AgCharts options={barOptions} style={{ height: '210px' }} />
          )}
        </div>

        {/* Pie chart */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-3">
            <p className="font-semibold text-stone-800">Auction Health</p>
            <p className="text-xs text-gray-400 mt-0.5">Active vs inactive auctions</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <>
              <AgCharts options={pieOptions} style={{ height: '160px' }} />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-emerald-700">{analytics?.activeAuctions ?? 0}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Active</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold text-gray-600">
                    {Math.max(0, (analytics?.totalAuctions ?? 0) - (analytics?.activeAuctions ?? 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Inactive</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Auctions Widget */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <p className="font-semibold text-stone-800 text-sm">Pending Review</p>
              {pendingAuctions.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
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
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <Gavel className="h-5 w-5 opacity-40" />
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

        {/* Open Disputes Widget */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              </div>
              <p className="font-semibold text-stone-800 text-sm">Open Disputes</p>
              {openDisputes.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
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
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5 opacity-40" />
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
