'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Product, Supplier } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Pencil, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import DuplicateProductButton from '@/components/admin/DuplicateProductButton'
import { bulkDeleteProducts, bulkSetProductsActive } from '@/app/admin/urunler/actions'
import { toast } from 'sonner'
import BulkOperationModal from '@/components/admin/BulkOperationModal'

interface Props {
  products: Product[]
  suppliers?: Supplier[]
}

type SortKey = 'name' | 'category' | 'price' | 'stock' | 'status'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

export default function ProductsTable({ products, suppliers = [] }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [supplier, setSupplier] = useState('all')
  const [status, setStatus] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p: any) => {
      if (p.category?.name) map.set(p.category.name, p.category.name)
    })
    return Array.from(map.values())
  }, [products])

  const filtered = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'all' || p.category?.name === category
      const matchesSupplier =
        supplier === 'all' ? true :
        supplier === 'none' ? !p.supplier_id :
        p.supplier_id === supplier
      const matchesStatus =
        status === 'all' ||
        (status === 'active' && p.is_active) ||
        (status === 'passive' && !p.is_active)
      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus
    })
  }, [products, search, category, supplier, status])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a: any, b: any) => {
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name, 'tr') * dir
        case 'category': return (a.category?.name ?? '').localeCompare(b.category?.name ?? '', 'tr') * dir
        case 'price': return ((a.sale_price ?? a.price) - (b.sale_price ?? b.price)) * dir
        case 'stock': return (a.stock - b.stock) * dir
        case 'status': return (Number(a.is_active) - Number(b.is_active)) * dir
        default: return 0
      }
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(() => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [sorted, currentPage])

  const resetToFirstPage = () => setPage(1)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown size={12} className="text-muted-foreground/50" />
    return dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  const allOnPageSelected = paged.length > 0 && paged.every((p: any) => selected.has(p.id))

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        paged.forEach((p: any) => next.delete(p.id))
      } else {
        paged.forEach((p: any) => next.add(p.id))
      }
      return next
    })
  }

  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`${selected.size} ürünü silmek istediğinizden emin misiniz?`)) return
    setBulkBusy(true)
    try {
      await bulkDeleteProducts(Array.from(selected))
      toast.success(`${selected.size} ürün silindi`)
      clearSelection()
    } catch (e: any) {
      toast.error('Toplu silme başarısız: ' + e.message)
    } finally {
      setBulkBusy(false)
    }
  }

  const handleBulkSetActive = async (active: boolean) => {
    if (selected.size === 0) return
    setBulkBusy(true)
    try {
      await bulkSetProductsActive(Array.from(selected), active)
      toast.success(`${selected.size} ürün ${active ? 'aktif' : 'pasif'} yapıldı`)
      clearSelection()
    } catch (e: any) {
      toast.error('Toplu güncelleme başarısız: ' + e.message)
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetToFirstPage() }}
            placeholder="Ürün adı veya slug ara..."
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); resetToFirstPage() }}
          className="h-9 px-3 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
        >
          <option value="all">Tüm Kategoriler</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); resetToFirstPage() }}
          className="h-9 px-3 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
        {suppliers.length > 0 && (
          <select
            value={supplier}
            onChange={(e) => { setSupplier(e.target.value); resetToFirstPage() }}
            className="h-9 px-3 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
          >
            <option value="all">Tüm Tedarikçiler</option>
            <option value="none">Tedarikçisiz</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        {(search || category !== 'all' || supplier !== 'all' || status !== 'all') && (
          <button
            onClick={() => { setSearch(''); setCategory('all'); setSupplier('all'); setStatus('all'); resetToFirstPage() }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Filtreleri temizle
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} / {products.length} ürün</span>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#222222]/10 border border-[#222222]/30 rounded-xl px-4 py-2.5">
          <span className="text-sm font-semibold text-[#222222]">{selected.size} ürün seçildi</span>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Button
              size="sm"
              disabled={bulkBusy}
              onClick={() => setBulkModalOpen(true)}
              className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white gap-1.5"
            >
              <SlidersHorizontal size={13} />
              Toplu İşlem
            </Button>
            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => handleBulkSetActive(true)}>Aktif Yap</Button>
            <Button size="sm" variant="outline" disabled={bulkBusy} onClick={() => handleBulkSetActive(false)}>Pasif Yap</Button>
            <Button size="sm" variant="outline" disabled={bulkBusy} className="text-destructive hover:text-destructive" onClick={handleBulkDelete}>Sil</Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Vazgeç</Button>
          </div>
        </div>
      )}

      {bulkModalOpen && (
        <BulkOperationModal
          selectedIds={Array.from(selected)}
          suppliers={suppliers}
          onClose={() => setBulkModalOpen(false)}
          onDone={() => { setBulkModalOpen(false); clearSelection() }}
        />
      )}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Henüz ürün eklenmedi.</p>
            <Link href="/admin/urunler/yeni" className="text-[#222222] hover:underline text-sm mt-2 block">
              İlk ürünü ekle →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Aramanızla eşleşen ürün bulunamadı.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      className="accent-[#222222] w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 hover:text-foreground">
                      Ürün Adı <SortIcon active={sortKey === 'name'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('category')} className="flex items-center gap-1.5 hover:text-foreground">
                      Kategori <SortIcon active={sortKey === 'category'} dir={sortDir} />
                    </button>
                  </th>
                  {suppliers.length > 0 && (
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tedarikçi</th>
                  )}
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('price')} className="flex items-center gap-1.5 hover:text-foreground">
                      Fiyat <SortIcon active={sortKey === 'price'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('stock')} className="flex items-center gap-1.5 hover:text-foreground">
                      Stok <SortIcon active={sortKey === 'stock'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button onClick={() => toggleSort('status')} className="flex items-center gap-1.5 hover:text-foreground">
                      Durum <SortIcon active={sortKey === 'status'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paged.map((p: any) => (
                  <tr key={p.id} className={`hover:bg-secondary/20 transition-colors ${selected.has(p.id) ? 'bg-[#222222]/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                        className="accent-[#222222] w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                    {suppliers.length > 0 && (
                      <td className="px-4 py-3">
                        {p.supplier_id ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                            {suppliers.find((s) => s.id === p.supplier_id)?.name ?? '—'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-[#222222]">{p.price.toLocaleString('tr-TR')} ₺</p>
                        {p.sale_price && (
                          <p className="text-xs text-muted-foreground line-through">{p.sale_price.toLocaleString('tr-TR')} ₺</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.is_active ? 'default' : 'secondary'} className={p.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                        {p.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/urunler/${p.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil size={14} />
                          </Button>
                        </Link>
                        <DuplicateProductButton productId={p.id} productName={p.name} />
                        <DeleteProductButton productId={p.id} productName={p.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Sayfa {currentPage} / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={14} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
