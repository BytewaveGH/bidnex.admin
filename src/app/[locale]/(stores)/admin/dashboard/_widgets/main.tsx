'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  DollarSign, Gavel, TrendingUp, AlertCircle, RotateCcw, Target,
  BarChart2, Lightbulb, Clock, ChevronLeft, ChevronRight, Edit3,
  Check, X, Activity, ArrowRight, MessageSquare, Users,
} from 'lucide-react'
import { AgCharts } from 'ag-charts-react'
import { AgChartOptions } from 'ag-charts-community'
import { useFetchData } from '@/hooks/use-fetch'
import { IGeneric } from '@/types/interfaces'
import { IAnalytics, IAuction, IDispute } from '@/types/interfaces/gems-bid'
import { AnalyticsServices } from '../_logics/services'
import { AuctionServices } from '../../auctions/_logics/services'
import { DisputeServices } from '../../disputes/_logics/services'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtGHS = (v: number) =>
  `GHS ${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtK = (v: number) =>
  v >= 1000 ? `GHS ${(v / 1000).toFixed(1)}K` : `GHS ${v}`
const fmtDate = (d: Date) => d.toISOString().slice(0, 10)

// ─── Mock chart data ──────────────────────────────────────────────────────────
// Replace each dataset with a real API endpoint when available
const MOCK_DAILY = [
  { day: 'Mon', revenue: 8200, profit: 1640 },
  { day: 'Tue', revenue: 6800, profit: 1360 },
  { day: 'Wed', revenue: 9500, profit: 1900 },
  { day: 'Thu', revenue: 7200, profit: 1440 },
  { day: 'Fri', revenue: 11400, profit: 2280 },
  { day: 'Sat', revenue: 15800, profit: 3160 },
  { day: 'Sun', revenue: 4200, profit: 840 },
]

const MOCK_MONTHLY = [
  { month: 'Jul', value: 42000 }, { month: 'Aug', value: 38500 },
  { month: 'Sep', value: 51000 }, { month: 'Oct', value: 58000 },
  { month: 'Nov', value: 72000 }, { month: 'Dec', value: 95000 },
  { month: 'Jan', value: 78000 }, { month: 'Feb', value: 62000 },
  { month: 'Mar', value: 68000 }, { month: 'Apr', value: 61000 },
  { month: 'May', value: 79000 }, { month: 'Jun', value: 95350 },
]

const MOCK_HOURLY = [
  { hour: '7am', revenue: 280 }, { hour: '8am', revenue: 520 },
  { hour: '9am', revenue: 940 }, { hour: '10am', revenue: 1680 },
  { hour: '11am', revenue: 2100 }, { hour: '12pm', revenue: 2450 },
  { hour: '1pm', revenue: 1820 }, { hour: '2pm', revenue: 1380 },
  { hour: '3pm', revenue: 1140 }, { hour: '4pm', revenue: 1560 },
  { hour: '5pm', revenue: 1200 }, { hour: '6pm', revenue: 780 },
  { hour: '7pm', revenue: 420 }, { hour: '8pm', revenue: 180 },
]

const MOCK_PAYMENT = [
  { method: 'Bank Transfer', amount: 58400, pct: 61, color: '#0865AC' },
  { method: 'MoMo', amount: 28200, pct: 30, color: '#E8920A' },
  { method: 'Cash', amount: 8750, pct: 9, color: '#82B8EE' },
]

const MOCK_AUCTION_PERF = [
  { name: 'June Gems Gala', revenue: 42800, pct: 45, lots: 18, bids: 164 },
  { name: 'Estate Jewellery Sale', revenue: 31200, pct: 33, lots: 12, bids: 98 },
  { name: 'Gemstone Collectors', revenue: 13750, pct: 14, lots: 9, bids: 74 },
  { name: 'Gold & Silver Auction', revenue: 7600, pct: 8, lots: 6, bids: 42 },
]

const MOCK_LOTS = [
  { name: 'Diamond Solitaire Ring (3.2ct)', auction: 'June Gems Gala', bids: 48, revenue: 28400, margin: 30 },
  { name: 'Emerald Pendant Set', auction: 'Estate Jewellery Sale', bids: 31, revenue: 15200, margin: 35 },
  { name: 'Sapphire Tennis Bracelet', auction: 'June Gems Gala', bids: 27, revenue: 12800, margin: 12 },
  { name: 'Ruby Earrings — Vintage', auction: 'Estate Jewellery Sale', bids: 19, revenue: 9600, margin: 32 },
  { name: '22k Gold Chain (50g)', auction: 'Gold & Silver', bids: 15, revenue: 8200, margin: 8 },
  { name: 'Amethyst Cocktail Ring', auction: 'Gemstone Collectors', bids: 22, revenue: 7400, margin: 35 },
  { name: 'Pearl Necklace (AAA Grade)', auction: 'Estate Jewellery Sale', bids: 18, revenue: 6800, margin: 12 },
  { name: 'Tanzanite Stud Pair', auction: 'Gemstone Collectors', bids: 14, revenue: 5200, margin: 35 },
  { name: 'Platinum Wedding Band Set', auction: 'June Gems Gala', bids: 11, revenue: 4800, margin: 22 },
  { name: 'Aquamarine Drop Earrings', auction: 'Gemstone Collectors', bids: 17, revenue: 4200, margin: 28 },
  { name: 'Garnet Statement Ring', auction: 'Estate Jewellery Sale', bids: 9, revenue: 3800, margin: 14 },
  { name: 'Silver Charm Bracelet', auction: 'Gold & Silver', bids: 13, revenue: 2900, margin: 38 },
  { name: 'Citrine Pendant (Natural)', auction: 'Gemstone Collectors', bids: 8, revenue: 2400, margin: 42 },
  { name: 'Gold Signet Ring (18k)', auction: 'Gold & Silver', bids: 10, revenue: 2100, margin: 18 },
  { name: 'Opal Brooch — Art Deco', auction: 'Estate Jewellery Sale', bids: 7, revenue: 1900, margin: 24 },
  { name: 'Topaz Cluster Ring', auction: 'Gemstone Collectors', bids: 6, revenue: 1600, margin: 31 },
]

const HM_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HM_HOURS = ['7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm']
const MOCK_HEATMAP = [
  [8, 15, 42, 78, 95, 110, 85, 68, 55, 72, 60, 38, 20, 6],
  [6, 12, 38, 72, 88, 102, 79, 61, 48, 66, 54, 32, 16, 4],
  [5, 10, 28, 58, 72, 84, 65, 50, 38, 52, 42, 25, 12, 3],
  [9, 18, 52, 88, 104, 118, 92, 74, 60, 80, 68, 44, 24, 7],
  [12, 24, 68, 105, 124, 136, 108, 88, 72, 96, 82, 56, 32, 10],
  [18, 35, 88, 128, 148, 162, 134, 112, 95, 118, 104, 78, 50, 18],
  [4, 7, 20, 38, 45, 52, 42, 34, 25, 32, 24, 14, 7, 2],
]
const HM_SCALE = ['#EEF2FA', '#AECDEE', '#5A9AD8', '#2A6EBA', '#0D1E36']
const hmColor = (v: number, max: number) => HM_SCALE[Math.min(4, Math.floor((v / max) * 5))]

const ROWS_PER_PAGE = 8

// ─── Sub-components ───────────────────────────────────────────────────────────
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
)

interface SectionHeaderProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  sub?: string
  action?: React.ReactNode
}
const SectionHeader = ({ icon, iconBg, title, sub, action }: SectionHeaderProps) => (
  <div className="flex items-center gap-3 px-5 py-4">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-stone-800 leading-tight">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
)

interface KpiCardProps {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  sub?: string
  loading?: boolean
  alert?: boolean
}
const KpiCard = ({ label, value, icon, iconBg, sub, loading, alert }: KpiCardProps) => (
  <Card className="p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      {alert && (
        <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
          Action needed
        </span>
      )}
    </div>
    {loading ? (
      <div className="h-8 w-32 animate-pulse bg-gray-100 rounded-lg" />
    ) : (
      <div>
        <p className="text-2xl font-extrabold text-stone-800 leading-none tracking-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-2 font-medium">{sub ?? label}</p>
      </div>
    )}
  </Card>
)

interface BudgetRowProps { label: string; actual: number; target: number }
const BudgetRow = ({ label, actual, target }: BudgetRowProps) => {
  const pct = Math.min(100, Math.round((actual / (target || 1)) * 100))
  const hit = pct >= 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        <span className="text-xs text-gray-500">{fmtGHS(actual)} / {fmtGHS(target)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${hit ? 'bg-emerald-500' : 'bg-endeavour'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {hit ? '✓ Target exceeded!' : `${fmtGHS(target - actual)} remaining · ${pct}%`}
      </p>
    </div>
  )
}

type InsightType = 'positive' | 'negative' | 'warning' | 'neutral'
const INSIGHT_STYLE: Record<InsightType, { bg: string; border: string; dot: string }> = {
  positive: { bg: 'bg-emerald-50', border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
  negative: { bg: 'bg-red-50', border: 'border-l-red-500', dot: 'bg-red-500' },
  warning:  { bg: 'bg-amber-50', border: 'border-l-amber-500', dot: 'bg-amber-500' },
  neutral:  { bg: 'bg-blue-50', border: 'border-l-blue-500', dot: 'bg-blue-500' },
}
const InsightItem = ({ type, text }: { type: InsightType; text: string }) => {
  const s = INSIGHT_STYLE[type]
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 ${s.bg} ${s.border}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${s.dot}`} />
      <p className="text-sm text-stone-700 leading-relaxed">{text}</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Main = () => {
  // Real data
  const { data: analyticsRaw, isLoading, refetch } = useFetchData(
    'admin-analytics',
    AnalyticsServices.FetchAll() as unknown as IGeneric
  )
  const analytics = analyticsRaw as IAnalytics.Response | undefined

  const { data: pendingRaw } = useFetchData(
    'dash-pending-auctions',
    AuctionServices.FetchAll({ status: 'pending_review', limit: 5 }) as unknown as IGeneric
  )
  const pendingAuctions = (pendingRaw as IAuction[]) ?? []

  const { data: disputesRaw } = useFetchData(
    'dash-open-disputes',
    DisputeServices.FetchAll({ status: 'open', limit: 5 }) as unknown as IGeneric
  )
  const openDisputes = (disputesRaw as IDispute[]) ?? []

  // Date range
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return fmtDate(d)
  })
  const [dateTo, setDateTo] = useState(() => fmtDate(new Date()))
  const [activePreset, setActivePreset] = useState('30d')

  const applyPreset = (key: string) => {
    setActivePreset(key)
    const to = new Date()
    const from = new Date()
    if (key === '7d') from.setDate(from.getDate() - 6)
    else if (key === '30d') from.setDate(from.getDate() - 29)
    else if (key === '90d') from.setDate(from.getDate() - 89)
    else if (key === 'month') from.setDate(1)
    else if (key === 'last') { to.setDate(0); from.setDate(1); from.setMonth(to.getMonth()) }
    setDateFrom(fmtDate(from))
    setDateTo(fmtDate(to))
  }

  // Last-updated counter
  const [minsSince, setMinsSince] = useState(0)
  useEffect(() => {
    const clock = setInterval(() => setMinsSince(p => p + 1), 60_000)
    const auto = setInterval(() => { refetch(); setMinsSince(0) }, 600_000)
    return () => { clearInterval(clock); clearInterval(auto) }
  }, [refetch])

  // Budget (localStorage)
  const [budgets, setBudgets] = useState<{ daily: number; monthly: number }>(() => {
    if (typeof window === 'undefined') return { daily: 5000, monthly: 150000 }
    try { return JSON.parse(localStorage.getItem('gbid_budgets') || 'null') ?? { daily: 5000, monthly: 150000 } }
    catch { return { daily: 5000, monthly: 150000 } }
  })
  const [editBudget, setEditBudget] = useState(false)
  const [draftDaily, setDraftDaily] = useState(String(budgets.daily))
  const [draftMonthly, setDraftMonthly] = useState(String(budgets.monthly))
  const saveBudget = () => {
    const next = { daily: Number(draftDaily), monthly: Number(draftMonthly) }
    setBudgets(next)
    localStorage.setItem('gbid_budgets', JSON.stringify(next))
    setEditBudget(false)
  }

  // Daily chart preset (independent of global date range)
  const [dailyPreset, setDailyPreset] = useState('week')

  // Lot pagination
  const [lotPage, setLotPage] = useState(0)
  const totalLotPages = Math.ceil(MOCK_LOTS.length / ROWS_PER_PAGE)
  const visibleLots = MOCK_LOTS.slice(lotPage * ROWS_PER_PAGE, (lotPage + 1) * ROWS_PER_PAGE)

  // AgCharts options
  const dailyOptions: AgChartOptions = useMemo(() => ({
    data: MOCK_DAILY,
    series: [
      { type: 'bar' as const, xKey: 'day', yKey: 'revenue', yName: 'Revenue', fill: '#0865AC', strokeWidth: 0, cornerRadius: 4 },
      { type: 'bar' as const, xKey: 'day', yKey: 'profit', yName: 'Profit', fill: '#82B8EE', strokeWidth: 0, cornerRadius: 4 },
    ],
    axes: [
      { type: 'category' as const, position: 'bottom' as const, label: { fontSize: 11, color: '#9ca3af' }, line: { enabled: false } },
      {
        type: 'number' as const, position: 'left' as const,
        label: { fontSize: 11, color: '#9ca3af', formatter: ({ value }: { value: number }) => fmtK(value) },
        gridLine: { style: [{ stroke: '#f3f4f6', lineDash: [3, 3] }] },
      },
    ],
    background: { fill: 'transparent' },
    legend: { position: 'bottom' as const, item: { label: { fontSize: 11, color: '#6b7280' } } },
    padding: { top: 8, right: 8, bottom: 0, left: 0 },
  }), [])

  const monthlyOptions: AgChartOptions = useMemo(() => ({
    data: MOCK_MONTHLY,
    series: [{
      type: 'area' as const,
      xKey: 'month', yKey: 'value', yName: 'Revenue',
      fill: 'rgba(8,101,172,0.09)', stroke: '#0865AC', strokeWidth: 2.5,
      marker: { enabled: true, size: 5, fill: '#0865AC', stroke: '#fff', strokeWidth: 2 },
    }],
    axes: [
      { type: 'category' as const, position: 'bottom' as const, label: { fontSize: 11, color: '#9ca3af' }, line: { enabled: false } },
      {
        type: 'number' as const, position: 'left' as const,
        label: { fontSize: 11, color: '#9ca3af', formatter: ({ value }: { value: number }) => fmtK(value) },
        gridLine: { style: [{ stroke: '#f3f4f6', lineDash: [3, 3] }] },
      },
    ],
    background: { fill: 'transparent' },
    legend: { enabled: false },
    padding: { top: 8, right: 8, bottom: 0, left: 0 },
  }), [])

  const hourlyOptions: AgChartOptions = useMemo(() => ({
    data: MOCK_HOURLY,
    series: [
      { type: 'bar' as const, xKey: 'hour', yKey: 'revenue', yName: 'Revenue', fill: '#0865AC', strokeWidth: 0, cornerRadius: 3 },
    ],
    axes: [
      { type: 'category' as const, position: 'bottom' as const, label: { fontSize: 10, color: '#9ca3af' }, line: { enabled: false } },
      {
        type: 'number' as const, position: 'left' as const,
        label: { fontSize: 10, color: '#9ca3af', formatter: ({ value }: { value: number }) => fmtK(value) },
        gridLine: { style: [{ stroke: '#f3f4f6', lineDash: [3, 3] }] },
      },
    ],
    background: { fill: 'transparent' },
    legend: { enabled: false },
    padding: { top: 8, right: 8, bottom: 0, left: 0 },
  }), [])

  // Smart insights computed from real analytics
  const insights = useMemo(() => {
    const items: Array<{ type: InsightType; text: string }> = []
    if (!analytics) return items
    if (analytics.totalRevenue > 0)
      items.push({ type: 'positive', text: `Total platform revenue this period is ${fmtGHS(analytics.totalRevenue)} across all settled lots.` })
    if (analytics.activeAuctions > 0)
      items.push({ type: 'neutral', text: `${analytics.activeAuctions} auction${analytics.activeAuctions !== 1 ? 's are' : ' is'} currently live — monitor bid volume closely for peak-hour spikes.` })
    if (analytics.totalBidsToday > 0)
      items.push({ type: 'neutral', text: `${analytics.totalBidsToday.toLocaleString()} bids placed today. Historical patterns show peak activity between 10 am and 12 pm.` })
    if (analytics.openDisputes > 0)
      items.push({ type: 'warning', text: `${analytics.openDisputes} open dispute${analytics.openDisputes !== 1 ? 's need' : ' needs'} resolution — unresolved disputes delay vendor payouts and affect trust scores.` })
    else
      items.push({ type: 'positive', text: 'No open disputes right now — all buyer-seller transactions are resolving cleanly.' })
    if (analytics.totalUsers > 0)
      items.push({ type: 'neutral', text: `${analytics.totalUsers.toLocaleString()} registered users on platform. Engage inactive bidders before high-value auction windows to boost lot competition.` })
    return items.slice(0, 5)
  }, [analytics])

  const hmMax = useMemo(() => Math.max(...MOCK_HEATMAP.flat()), [])

  const DATE_PRESETS = [
    { label: '7d', key: '7d' },
    { label: '30d', key: '30d' },
    { label: '90d', key: '90d' },
    { label: 'This month', key: 'month' },
    { label: 'Last month', key: 'last' },
  ]

  const DAILY_PRESETS = [
    { label: 'This week', key: 'week' },
    { label: '14d', key: '14d' },
    { label: '30d', key: '30d' },
  ]

  return (
    <main className="w-full flex flex-col gap-0 -mt-1">

      {/* ── Analytics sub-header ── */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 shadow-sm -mx-6 px-6 mb-5">
        <div className="flex items-center gap-3 pt-3 pb-2">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-stone-800">Analytics</span>
            <span className="text-xs text-gray-400 ml-2.5">
              Updated {minsSince === 0 ? 'just now' : `${minsSince} min${minsSince !== 1 ? 's' : ''} ago`}
            </span>
          </div>
          <button
            onClick={() => { refetch(); setMinsSince(0) }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-endeavour bg-white border border-gray-200 hover:border-endeavour rounded-xl px-3 py-1.5 transition-all shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">From</span>
            <input
              type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setActivePreset('') }}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 bg-white focus:outline-none focus:ring-1 focus:ring-endeavour shadow-sm"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setActivePreset('') }}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 bg-white focus:outline-none focus:ring-1 focus:ring-endeavour shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DATE_PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activePreset === p.key
                    ? 'bg-endeavour text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-endeavour hover:text-endeavour'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Total Revenue"
            value={isLoading ? '—' : fmtGHS(analytics?.totalRevenue ?? 0)}
            icon={<DollarSign className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-100"
            sub="All settled lots"
            loading={isLoading}
          />
          <KpiCard
            label="Active Auctions"
            value={isLoading ? '—' : (analytics?.activeAuctions ?? 0).toLocaleString()}
            icon={<Activity className="h-5 w-5 text-endeavour" />}
            iconBg="bg-blue-100"
            sub="Live right now"
            loading={isLoading}
          />
          <KpiCard
            label="Bids Today"
            value={isLoading ? '—' : (analytics?.totalBidsToday ?? 0).toLocaleString()}
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
            sub="Across all auctions"
            loading={isLoading}
          />
          <KpiCard
            label="Open Disputes"
            value={isLoading ? '—' : (analytics?.openDisputes ?? 0).toLocaleString()}
            icon={<AlertCircle className={`h-5 w-5 ${(analytics?.openDisputes ?? 0) > 0 ? 'text-red-500' : 'text-gray-400'}`} />}
            iconBg={(analytics?.openDisputes ?? 0) > 0 ? 'bg-red-100' : 'bg-gray-100'}
            sub={(analytics?.openDisputes ?? 0) > 0 ? 'Need resolution' : 'All clear'}
            loading={isLoading}
            alert={(analytics?.openDisputes ?? 0) > 0}
          />
        </div>

        {/* ── Budget Targets ── */}
        <Card>
          <SectionHeader
            icon={<Target className="h-4 w-4 text-endeavour" />}
            iconBg="bg-blue-50"
            title="Revenue Targets"
            sub="Daily and monthly progress"
            action={
              !editBudget ? (
                <button
                  onClick={() => { setDraftDaily(String(budgets.daily)); setDraftMonthly(String(budgets.monthly)); setEditBudget(true) }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-endeavour border border-gray-200 rounded-xl px-3 py-1.5 transition-all"
                >
                  <Edit3 className="h-3 w-3" /> Edit targets
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button onClick={saveBudget} className="flex items-center gap-1.5 text-xs bg-endeavour text-white rounded-xl px-3 py-1.5 hover:bg-veniceBlue transition-colors">
                    <Check className="h-3 w-3" /> Save
                  </button>
                  <button onClick={() => setEditBudget(false)} className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-500 rounded-xl px-3 py-1.5">
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              )
            }
          />
          <div className="px-5 pb-5 -mt-1">
            {editBudget ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Daily target (GHS)', val: draftDaily, set: setDraftDaily },
                  { label: 'Monthly target (GHS)', val: draftMonthly, set: setDraftMonthly },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-stone-700 block mb-1.5">{label}</label>
                    <input
                      type="number" value={val} onChange={e => set(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <BudgetRow
                  label="Daily target"
                  actual={analytics?.totalRevenue ? Math.round(analytics.totalRevenue / 30) : 0}
                  target={budgets.daily}
                />
                <BudgetRow
                  label="Monthly target"
                  actual={analytics?.totalRevenue ?? 0}
                  target={budgets.monthly}
                />
              </div>
            )}
          </div>
        </Card>

        {/* ── Daily Revenue Chart ── */}
        <Card>
          <SectionHeader
            icon={<BarChart2 className="h-4 w-4 text-endeavour" />}
            iconBg="bg-blue-50"
            title="Daily Revenue & Profit"
            sub="Revenue vs profit per day"
            action={
              <div className="flex items-center gap-1">
                {DAILY_PRESETS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setDailyPreset(p.key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      dailyPreset === p.key ? 'bg-endeavour text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            }
          />
          <div className="px-5 pb-5">
            <AgCharts options={dailyOptions} style={{ height: '220px' }} />
          </div>
        </Card>

        {/* ── Monthly + Payment ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <SectionHeader
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              iconBg="bg-emerald-50"
              title="Monthly Revenue"
              sub="Last 12 months"
            />
            <div className="px-5 pb-5">
              <AgCharts options={monthlyOptions} style={{ height: '200px' }} />
            </div>
          </Card>

          <Card>
            <SectionHeader
              icon={<Activity className="h-4 w-4 text-amber-600" />}
              iconBg="bg-amber-50"
              title="Payment Methods"
              sub="Settlement breakdown this period"
            />
            <div className="px-5 pb-5 flex flex-col gap-4">
              {MOCK_PAYMENT.map(p => (
                <div key={p.method}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-stone-700">{p.method}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold" style={{ color: p.color }}>{fmtGHS(p.amount)}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{p.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.pct}%`, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Hourly Bidding Activity ── */}
        <Card>
          <SectionHeader
            icon={<Clock className="h-4 w-4 text-amber-600" />}
            iconBg="bg-amber-50"
            title="Hourly Bidding Activity"
            sub="Revenue by hour — 7am to 8pm"
          />
          <div className="px-5 pb-5">
            <AgCharts options={hourlyOptions} style={{ height: '200px' }} />
          </div>
        </Card>

        {/* ── Activity Heatmap ── */}
        <Card>
          <SectionHeader
            icon={<BarChart2 className="h-4 w-4 text-endeavour" />}
            iconBg="bg-blue-50"
            title="Activity Heatmap"
            sub="Bid volume by day and hour of the week"
          />
          <div className="px-5 pb-5">
            <div className="overflow-x-auto">
              <div style={{ minWidth: 540 }}>
                <div className="grid mb-2" style={{ gridTemplateColumns: '44px repeat(14, 1fr)' }}>
                  <div />
                  {HM_HOURS.map((h, i) => (
                    <div key={h} className="text-center text-[10px] text-gray-400 font-medium px-0.5">
                      {i % 2 === 0 ? h : ''}
                    </div>
                  ))}
                </div>
                {HM_DAYS.map((day, di) => (
                  <div key={day} className="grid mb-1" style={{ gridTemplateColumns: '44px repeat(14, 1fr)', gap: '2px' }}>
                    <div className="text-[11px] text-gray-400 font-medium flex items-center">{day}</div>
                    {MOCK_HEATMAP[di].map((v, hi) => (
                      <div
                        key={hi}
                        className="h-7 rounded-sm cursor-default"
                        style={{ background: hmColor(v, hmMax) }}
                        title={`${day} ${HM_HOURS[hi]}: ${v} bids`}
                      />
                    ))}
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-gray-400">Low</span>
                  {HM_SCALE.map((c, i) => (
                    <div key={i} className="w-5 h-3 rounded-sm" style={{ background: c }} />
                  ))}
                  <span className="text-xs text-gray-400">Peak</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Top Lots Table ── */}
        <Card>
          <SectionHeader
            icon={<span className="text-base leading-none">💎</span>}
            iconBg="bg-amber-50"
            title="Top Lots by Revenue"
            sub={`${MOCK_LOTS.length} lots this period`}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-100 bg-gray-50/60">
                  {['Lot', 'Auction', 'Bids', 'Revenue', 'Margin'].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 text-xs font-bold uppercase tracking-wide text-gray-400 ${i === 0 ? 'text-left px-5' : i < 2 ? 'text-left px-4' : 'text-right px-4'} ${i === 4 ? 'pr-5' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleLots.map((lot, i) => {
                  const mc = lot.margin > 30
                    ? 'bg-emerald-50 text-emerald-700'
                    : lot.margin >= 10
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-600'
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3 font-semibold text-stone-800 max-w-[220px] truncate">{lot.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{lot.auction}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{lot.bids}</td>
                      <td className="px-4 py-3 text-right font-bold text-stone-800">{fmtGHS(lot.revenue)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${mc}`}>{lot.margin}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40 rounded-b-2xl">
            <span className="text-xs text-gray-500">Page {lotPage + 1} of {totalLotPages} · {MOCK_LOTS.length} lots</span>
            <div className="flex items-center gap-2">
              <button
                disabled={lotPage === 0}
                onClick={() => setLotPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl disabled:opacity-30 hover:border-endeavour hover:text-endeavour transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                disabled={lotPage >= totalLotPages - 1}
                onClick={() => setLotPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl disabled:opacity-30 hover:border-endeavour hover:text-endeavour transition-all"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>

        {/* ── Auction Performance + Actions Needed ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <SectionHeader
              icon={<Gavel className="h-4 w-4 text-endeavour" />}
              iconBg="bg-blue-50"
              title="Auction Performance"
              sub="Revenue share per auction this period"
            />
            <div className="px-5 pb-5 flex flex-col gap-4">
              {MOCK_AUCTION_PERF.map(a => (
                <div key={a.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-stone-700 truncate flex-1 mr-3">{a.name}</span>
                    <span className="text-sm font-bold text-endeavour flex-shrink-0">{fmtGHS(a.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-endeavour transition-all duration-500" style={{ width: `${a.pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{a.pct}% of period</span>
                    <span className="text-xs text-gray-400">{a.lots} lots · {a.bids} bids</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions needed — real data */}
          <Card>
            <SectionHeader
              icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
              iconBg="bg-amber-50"
              title="Actions Needed"
              sub="Pending reviews and open disputes"
            />
            <div className="px-4 pb-4 flex flex-col gap-3">
              {/* Pending review auctions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pending review</span>
                  <a href="/en/admin/auctions" className="text-xs text-endeavour hover:text-veniceBlue font-semibold flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
                {pendingAuctions.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">No auctions pending review</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {pendingAuctions.map(a => (
                      <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-amber-50/60 rounded-xl transition-colors group cursor-pointer">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Gavel className="h-3 w-3 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">{a.title}</p>
                          <p className="text-[11px] text-gray-400">Vendor #{a.vendorId} · {a.lotCount ?? 0} lots</p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100" />

              {/* Open disputes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Open disputes</span>
                  <a href="/en/admin/disputes" className="text-xs text-endeavour hover:text-veniceBlue font-semibold flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
                {openDisputes.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">No open disputes — all clear</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {openDisputes.map(d => (
                      <div key={d.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-red-50/60 rounded-xl transition-colors group cursor-pointer">
                        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-3 w-3 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">{d.reason}</p>
                          <p className="text-[11px] text-gray-400">Lot #{d.lotId} · Buyer #{d.buyerId}</p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-300 group-hover:text-red-400 transition-colors flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Smart Insights ── */}
        <Card>
          <SectionHeader
            icon={<Lightbulb className="h-4 w-4 text-amber-600" />}
            iconBg="bg-amber-50"
            title="Smart Insights"
            sub="Auto-computed from this period's live data"
          />
          <div className="px-5 pb-5 flex flex-col gap-2.5">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-12 animate-pulse bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl" />
              ))
            ) : insights.length > 0 ? (
              insights.map((ins, i) => <InsightItem key={i} {...ins} />)
            ) : (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <p className="text-sm">Analytics data is loading&hellip;</p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </main>
  )
}

export default Main
