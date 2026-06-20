'use client'

import React, { useMemo, useState } from 'react'
import { ColDef } from 'ag-grid-community'
import { Plus, Tag, Edit2, Trash2, ChevronRight } from 'lucide-react'
import DatagridTemplate from '@/components/templates/datagrid'
import { SheetTemplate } from '@/components/templates/sheet'
import { useFetchData } from '@/hooks/use-fetch'
import { useAxios } from '@/hooks/use-axios'
import { IGeneric } from '@/types/interfaces'
import { ICategory } from '@/types/interfaces/gems-bid'
import { CategoryServices } from '../_logics/services'
import CategoryForm from './_forms/category-form'
import { toast } from 'sonner'

type FlatCategory = ICategory & { depth: number; parentName: string | null }

const flattenCategories = (cats: ICategory[], depth = 0, parentName: string | null = null): FlatCategory[] =>
  cats.flatMap((cat) => [{ ...cat, depth, parentName }, ...flattenCategories(cat.children ?? [], depth + 1, cat.name)])

const Main = () => {
  const request = useAxios()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FlatCategory | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data: categoriesRaw, isLoading, refetch } = useFetchData('admin-categories', CategoryServices.FetchAll() as unknown as IGeneric)

  const flatCategories = useMemo(() => {
    const raw = categoriesRaw as ICategory[] | undefined
    if (!Array.isArray(raw)) return []
    return flattenCategories(raw)
  }, [categoriesRaw])

  const topLevelOptions = useMemo(
    () => flatCategories.filter((c) => c.depth === 0).map((c) => ({ id: c.id, name: c.name })),
    [flatCategories]
  )

  const topLevelCount = flatCategories.filter((c) => c.depth === 0).length
  const subCount = flatCategories.filter((c) => c.depth > 0).length

  const handleDelete = async (id: number, name: string) => {
    setDeletingId(id)
    try {
      await request(CategoryServices.Delete(id) as any)
      toast.success(`"${name}" deleted`)
      refetch()
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setDeletingId(null)
    }
  }

  const openCreate = () => {
    setSelectedCategory(null)
    setSheetOpen(true)
  }
  const openEdit = (row: FlatCategory) => {
    setSelectedCategory(row)
    setSheetOpen(true)
  }
  const closeSheet = () => {
    setSheetOpen(false)
    setSelectedCategory(null)
  }
  const handleFormSuccess = () => {
    closeSheet()
    refetch()
  }

  const columns: ColDef[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 70, cellStyle: { color: '#6b7280', fontSize: '12px' } },
      {
        field: 'name',
        headerName: 'Category Name',
        flex: 1,
        minWidth: 180,
        cellRenderer: ({ data }: any) => {
          if (!data) return null
          return (
            <div style={{ paddingLeft: `${data.depth * 24}px` }} className="flex items-center gap-1.5 h-full">
              {data.depth > 0 && <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  data.depth === 0 ? 'bg-endeavour/10' : 'bg-gray-100'
                }`}
              >
                <Tag className={`h-3 w-3 ${data.depth === 0 ? 'text-endeavour' : 'text-gray-400'}`} />
              </div>
              <span className={`text-sm ${data.depth === 0 ? 'font-semibold text-stone-800' : 'text-stone-600'}`}>{data.name}</span>
            </div>
          )
        },
      },
      {
        field: 'parentName',
        headerName: 'Parent',
        width: 160,
        cellRenderer: ({ value }: any) =>
          value ? (
            <span className="inline-flex items-center gap-1 text-xs text-endeavour bg-blue-50 px-2 py-0.5 rounded-full font-medium">
              {value}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Top-level</span>
          ),
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        minWidth: 180,
        valueFormatter: (p: any) => p.value ?? '—',
        cellStyle: { color: '#9ca3af', fontSize: '13px' },
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        width: 120,
        valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleDateString() : '—'),
        cellStyle: { color: '#9ca3af', fontSize: '12px' },
      },
      {
        field: 'actions',
        headerName: '',
        width: 110,
        pinned: 'right' as const,
        sortable: false,
        filter: false,
        cellRenderer: ({ data: row }: any) => {
          if (!row) return null
          return (
            <div className="flex items-center gap-1.5 h-full">
              <button
                onClick={() => openEdit(row)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                title="Edit"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(row.id, row.name)}
                disabled={deletingId === row.id}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        },
      },
    ],
    [deletingId]
  )

  return (
    <main className="w-full flex flex-col gap-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage auction item categories and subcategories</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-endeavour text-white text-sm font-semibold rounded-xl hover:bg-veniceBlue transition-colors shadow-sm shadow-endeavour/20 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-endeavour/10 flex items-center justify-center">
            <Tag className="h-5 w-5 text-endeavour" />
          </div>
          <div>
            <p className="text-xl font-bold text-stone-800">{flatCategories.length}</p>
            <p className="text-xs text-gray-500">Total Categories</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Tag className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-stone-800">{topLevelCount}</p>
            <p className="text-xs text-gray-500">Top-Level</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <ChevronRight className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-stone-800">{subCount}</p>
            <p className="text-xs text-gray-500">Subcategories</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DatagridTemplate
          columns={columns}
          data={flatCategories}
          enablePagination={false}
          paginationPageSize={200}
          selectionType="singleRow"
          loadingIndicator={isLoading}
          containerHeight={520}
          enableCheckboxes={false}
        />
      </div>

      {/* Sheet */}
      <SheetTemplate
        open={sheetOpen}
        title={selectedCategory ? 'Edit Category' : 'New Category'}
        headerRightText={selectedCategory ? `Editing: ${selectedCategory.name}` : 'Create a new auction category'}
        handleClose={closeSheet}
        contentClassName="md:min-w-[480px]"
        contentBodyClassName="p-5"
        content={
          <CategoryForm
            mode={selectedCategory ? 'update' : 'create'}
            categoryId={selectedCategory?.id}
            initialData={selectedCategory ?? undefined}
            parentOptions={selectedCategory ? topLevelOptions.filter((o) => o.id !== selectedCategory.id) : topLevelOptions}
            onSuccess={handleFormSuccess}
          />
        }
      />
    </main>
  )
}

export default Main
