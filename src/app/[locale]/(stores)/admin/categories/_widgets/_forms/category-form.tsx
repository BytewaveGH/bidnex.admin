'use client'

import React, { useState } from 'react'
import { Tag, Link as LinkIcon, FileText, ChevronDown } from 'lucide-react'
import { ICategory } from '@/types/interfaces/gems-bid'
import { CategoryServices } from '../../_logics/services'
import { useAxios } from '@/hooks/use-axios'
import { toast } from 'sonner'

interface CategoryFormProps {
  mode: 'create' | 'update'
  categoryId?: number
  initialData?: Partial<ICategory>
  parentOptions: Array<{ id: number; name: string }>
  onSuccess: () => void
}

const Field = ({
  label,
  required,
  error,
  icon: Icon,
  children,
  hint,
}: {
  label: string
  required?: boolean
  error?: string
  icon?: React.ElementType
  children: React.ReactNode
  hint?: string
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

const CategoryForm = ({ mode, categoryId, initialData, parentOptions, onSuccess }: CategoryFormProps) => {
  const request = useAxios()
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [iconUrl, setIconUrl] = useState(initialData?.iconUrl ?? '')
  const [parentId, setParentId] = useState<number | ''>(initialData?.parentId ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; iconUrl?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Category name is required'
    if (iconUrl && !/^https?:\/\/.+/.test(iconUrl)) e.iconUrl = 'Must be a valid URL starting with http:// or https://'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(iconUrl.trim() ? { iconUrl: iconUrl.trim() } : {}),
        parentId: parentId !== '' ? Number(parentId) : null,
      }
      if (mode === 'create') {
        await request(CategoryServices.Create(payload) as any)
        toast.success(`Category "${name}" created`)
      } else if (categoryId !== undefined) {
        await request(CategoryServices.Update(categoryId, payload) as any)
        toast.success(`Category "${name}" updated`)
      }
      onSuccess()
    } catch {
      toast.error('Failed to save category')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Name" required error={errors.name} icon={Tag} hint="Must be unique across all categories">
        <input
          value={name}
          onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })) }}
          placeholder="e.g. Electronics, Jewellery..."
          className={`border rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all placeholder-gray-400 ${
            errors.name ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
          }`}
          autoFocus
        />
      </Field>

      <Field label="Description" icon={FileText} hint="Optional — helps vendors choose the right category">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of what items belong in this category..."
          className="border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour resize-none placeholder-gray-400 transition-all"
        />
      </Field>

      <Field label="Icon URL" error={errors.iconUrl} icon={LinkIcon} hint="Optional — link to an SVG or PNG icon">
        <input
          value={iconUrl}
          onChange={e => { setIconUrl(e.target.value); if (errors.iconUrl) setErrors(p => ({ ...p, iconUrl: undefined })) }}
          placeholder="https://storage.example.com/icons/..."
          className={`border rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all placeholder-gray-400 ${
            errors.iconUrl ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'
          }`}
        />
        {iconUrl && /^https?:\/\/.+/.test(iconUrl) && (
          <div className="flex items-center gap-2 mt-1">
            <img src={iconUrl} alt="icon preview" className="w-6 h-6 rounded object-contain border border-gray-200" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="text-xs text-gray-400">Preview</span>
          </div>
        )}
      </Field>

      <Field label="Parent Category" icon={ChevronDown} hint="Leave empty to create a top-level category">
        <div className="relative">
          <select
            value={parentId}
            onChange={e => setParentId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full appearance-none border border-gray-200 bg-gray-50/50 rounded-xl px-3.5 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-endeavour/30 focus:border-endeavour transition-all pr-9"
          >
            <option value="">None (top-level category)</option>
            {parentOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </Field>

      <div className="pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-endeavour text-white text-sm font-bold hover:bg-veniceBlue disabled:opacity-50 transition-colors shadow-sm shadow-endeavour/20"
        >
          {isSubmitting
            ? (mode === 'create' ? 'Creating...' : 'Saving...')
            : (mode === 'create' ? 'Create Category' : 'Save Changes')}
        </button>
      </div>
    </form>
  )
}

export default CategoryForm
