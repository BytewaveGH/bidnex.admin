'use client'

import React, { useState } from 'react'
import { Type, FileText, MapPin, Calendar, Star } from 'lucide-react'
import { IAuction, IAuctionCreatePayload } from '@/types/interfaces/gems-bid'
import { AuctionServices } from '../../_logics/services'
import { useAxios } from '@/hooks/use-axios'
import { toast } from 'sonner'

interface AuctionFormProps {
  mode: 'create' | 'update'
  auctionId?: number
  initialData?: Partial<IAuction>
  onSuccess: () => void
}

const toLocalDatetime = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const Field = ({
  label,
  required,
  error,
  icon: Icon,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  icon?: React.ElementType
  hint?: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
      {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
)

const AuctionForm = ({ mode, auctionId, initialData, onSuccess }: AuctionFormProps) => {
  const request = useAxios()

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [locationName, setLocationName] = useState(initialData?.locationName ?? '')
  const [locationAddress, setLocationAddress] = useState(initialData?.locationAddress ?? '')
  const [startTime, setStartTime] = useState(toLocalDatetime(initialData?.startTime))
  const [endTime, setEndTime] = useState(toLocalDatetime(initialData?.endTime))
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!startTime) e.startTime = 'Start time is required'
    if (!endTime) e.endTime = 'End time is required'
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      e.endTime = 'End time must be after start time'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const clearError = (key: string) => setErrors(p => { const n = { ...p }; delete n[key]; return n })

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const payload: IAuctionCreatePayload = {
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(locationName.trim() ? { locationName: locationName.trim() } : {}),
        ...(locationAddress.trim() ? { locationAddress: locationAddress.trim() } : {}),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        isFeatured,
      }
      if (mode === 'create') {
        await request(AuctionServices.Create(payload) as any)
        toast.success(`Auction "${title}" created`)
      } else if (auctionId !== undefined) {
        await request(AuctionServices.Update(auctionId, payload) as any)
        toast.success(`Auction "${title}" updated`)
      }
      onSuccess()
    } catch {
      toast.error('Failed to save auction')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <Field label="Title" required error={errors.title} icon={Type} hint="Shown to bidders — be descriptive">
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); clearError('title') }}
          placeholder="e.g. Electronics Clearance — June 2026"
          className={`border rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all placeholder-gray-400 ${errors.title ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'}`}
          autoFocus
        />
      </Field>

      {/* Description */}
      <Field label="Description" icon={FileText} hint="Optional overview of what's being auctioned">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the auction, featured items, or bidding rules..."
          className="border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour resize-none placeholder-gray-400 transition-all"
        />
      </Field>

      {/* Location */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location Name" icon={MapPin}>
          <input
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            placeholder="e.g. Accra"
            className="border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all placeholder-gray-400"
          />
        </Field>
        <Field label="Address" icon={MapPin}>
          <input
            value={locationAddress}
            onChange={e => setLocationAddress(e.target.value)}
            placeholder="e.g. Ring Road, Accra"
            className="border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all placeholder-gray-400"
          />
        </Field>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Time" required error={errors.startTime} icon={Calendar}>
          <input
            type="datetime-local"
            value={startTime}
            onChange={e => { setStartTime(e.target.value); clearError('startTime'); clearError('endTime') }}
            className={`border rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all ${errors.startTime ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'}`}
          />
        </Field>
        <Field label="End Time" required error={errors.endTime} icon={Calendar}>
          <input
            type="datetime-local"
            value={endTime}
            onChange={e => { setEndTime(e.target.value); clearError('endTime') }}
            min={startTime}
            className={`border rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all ${errors.endTime ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'}`}
          />
        </Field>
      </div>

      {/* Featured toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50/60 rounded-xl border border-amber-100">
        <div className="flex items-center gap-2.5">
          <Star className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-stone-700">Featured Auction</p>
            <p className="text-xs text-gray-500">Highlighted on the platform homepage</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsFeatured(p => !p)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isFeatured ? 'bg-amber-500' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-endeavour text-white text-sm font-bold hover:bg-veniceBlue disabled:opacity-50 transition-colors shadow-sm shadow-endeavour/20"
        >
          {isSubmitting
            ? (mode === 'create' ? 'Creating Auction...' : 'Saving Changes...')
            : (mode === 'create' ? 'Create Auction' : 'Save Changes')}
        </button>
      </div>
    </form>
  )
}

export default AuctionForm
