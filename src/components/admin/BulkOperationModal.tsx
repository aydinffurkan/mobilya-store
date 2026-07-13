'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { X, Loader2, Package, ToggleLeft, Trash2, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Supplier } from '@/types'
import { bulkOperateProducts, bulkDeleteProducts, type BulkOpType } from '@/app/admin/urunler/actions'

type Tab = 'fiyat' | 'stok' | 'durum' | 'tedarikci' | 'sil'

interface Props {
  selectedIds: string[]
  suppliers?: Supplier[]
  onClose: () => void
  onDone: () => void
}

const PRICE_OPS: { value: BulkOpType; label: string; hasInput: boolean; inputLabel: string; inputType: 'pct' | 'tl' }[] = [
  { value: 'price_increase_pct',  label: 'Normal fiyatı artır (%)',       hasInput: true, inputLabel: 'Artış oranı',    inputType: 'pct' },
  { value: 'price_decrease_pct',  label: 'Normal fiyatı indir (%)',        hasInput: true, inputLabel: 'İndirim oranı',  inputType: 'pct' },
  { value: 'price_increase_fixed', label: 'Normal fiyatı artır (₺)',      hasInput: true, inputLabel: 'Artış tutarı',   inputType: 'tl'  },
  { value: 'price_decrease_fixed', label: 'Normal fiyatı indir (₺)',      hasInput: true, inputLabel: 'İndirim tutarı', inputType: 'tl'  },
  { value: 'sale_price_set_pct',  label: 'İndirimli fiyat oluştur (% indirim)', hasInput: true, inputLabel: 'İndirim yüzdesi', inputType: 'pct' },
  { value: 'sale_price_remove',   label: 'İndirimi kaldır',               hasInput: false, inputLabel: '', inputType: 'pct' },
]

const STOCK_OPS: { value: BulkOpType; label: string; hasInput: boolean; inputLabel: string }[] = [
  { value: 'stock_add',      label: 'Stok ekle',    hasInput: true,  inputLabel: 'Eklenecek miktar' },
  { value: 'stock_subtract', label: 'Stok çıkar',   hasInput: true,  inputLabel: 'Çıkarılacak miktar' },
  { value: 'stock_set',      label: 'Stok belirle', hasInput: true,  inputLabel: 'Yeni stok değeri' },
  { value: 'stock_zero',     label: 'Stoğu sıfırla', hasInput: false, inputLabel: '' },
]

function previewText(type: BulkOpType, value: number, count: number): string {
  const n = count
  switch (type) {
    case 'price_increase_pct':    return `${n} ürünün normal fiyatı %${value} artırılacak`
    case 'price_decrease_pct':    return `${n} ürünün normal fiyatı %${value} indirilecek`
    case 'price_increase_fixed':  return `${n} ürünün normal fiyatına ${value.toLocaleString('tr-TR')} ₺ eklenecek`
    case 'price_decrease_fixed':  return `${n} ürünün normal fiyatından ${value.toLocaleString('tr-TR')} ₺ düşülecek`
    case 'sale_price_set_pct':    return `${n} ürüne %${value} indirim uygulanacak (indirimli fiyat = fiyat × ${((100 - value) / 100).toFixed(2)})`
    case 'sale_price_remove':     return `${n} ürünün indirimli fiyatı kaldırılacak`
    case 'stock_add':             return `${n} ürünün stoğuna ${value} adet eklenecek`
    case 'stock_subtract':        return `${n} ürünün stoğundan ${value} adet düşülecek (min 0)`
    case 'stock_set':             return `${n} ürünün stoğu ${value} olarak ayarlanacak`
    case 'stock_zero':            return `${n} ürünün stoğu 0'a sıfırlanacak`
    case 'set_active':            return `${n} ürün aktif yapılacak`
    case 'set_passive':           return `${n} ürün pasif yapılacak`
    default:                      return ''
  }
}

export default function BulkOperationModal({ selectedIds, suppliers = [], onClose, onDone }: Props) {
  const count = selectedIds.length
  const [tab, setTab]                   = useState<Tab>('fiyat')
  const [priceOp, setPriceOp]           = useState<BulkOpType>('price_increase_pct')
  const [stockOp, setStockOp]           = useState<BulkOpType>('stock_add')
  const [statusOp, setStatusOp]         = useState<'set_active' | 'set_passive'>('set_active')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [inputVal, setInputVal]             = useState('10')
  const [cascadeVariants, setCascadeVariants]       = useState(false)
  const [cascadeComponents, setCascadeComponents]   = useState(false)
  const [busy, setBusy]                     = useState(false)
  const [deleteConfirm, setDeleteConfirm]   = useState(false)

  const activeOp: BulkOpType =
    tab === 'fiyat'     ? priceOp  :
    tab === 'stok'      ? stockOp  :
    tab === 'durum'     ? statusOp :
    tab === 'tedarikci' ? 'change_supplier' :
    'set_active' // unused for delete tab

  const currentPriceOpMeta = PRICE_OPS.find((o) => o.value === priceOp)!
  const currentStockOpMeta = STOCK_OPS.find((o) => o.value === stockOp)!
  const needsInput = tab === 'fiyat' ? currentPriceOpMeta.hasInput : tab === 'stok' ? currentStockOpMeta.hasInput : false
  const inputLabel = tab === 'fiyat' ? currentPriceOpMeta.inputLabel : currentStockOpMeta.inputLabel
  const inputType  = tab === 'fiyat' ? currentPriceOpMeta.inputType : 'tl'
  const parsedVal  = parseFloat(inputVal) || 0

  const supplierPreview = tab === 'tedarikci'
    ? (selectedSupplierId
        ? `${count} ürüne "${suppliers.find((s) => s.id === selectedSupplierId)?.name}" tedarikçisi atanacak`
        : `${count} ürünün tedarikçisi kaldırılacak`)
    : ''

  const preview = tab === 'tedarikci' ? supplierPreview : tab !== 'sil' ? previewText(activeOp, parsedVal, count) : ''

  const handleApply = async () => {
    if (needsInput && parsedVal <= 0) {
      toast.error('Geçerli bir değer girin (0\'dan büyük olmalı)')
      return
    }

    setBusy(true)
    try {
      const { updated } = await bulkOperateProducts(
        selectedIds,
        {
          type: activeOp,
          value: needsInput ? parsedVal : undefined,
          supplierId: tab === 'tedarikci' ? (selectedSupplierId || null) : undefined,
        },
        { variants: cascadeVariants, components: cascadeComponents }
      )
      toast.success(`${updated} ürün güncellendi`)
      onDone()
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    try {
      await bulkDeleteProducts(selectedIds)
      toast.success(`${count} ürün silindi`)
      onDone()
    } catch (e: unknown) {
      toast.error('Silme hatası: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; hide?: boolean }[] = [
    { id: 'fiyat',     label: 'Fiyat',      icon: <Package size={14} /> },
    { id: 'stok',      label: 'Stok',       icon: <Package size={14} /> },
    { id: 'durum',     label: 'Durum',      icon: <ToggleLeft size={14} /> },
    { id: 'tedarikci', label: 'Tedarikçi',  icon: <Truck size={14} />, hide: suppliers.length === 0 },
    { id: 'sil',       label: 'Sil',        icon: <Trash2 size={14} /> },
  ]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-base">Toplu İşlem</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{count} ürün seçili</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {tabs.filter((t) => !t.hide).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTab(t.id); setDeleteConfirm(false) }}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-lg transition-all ${
                  tab === t.id
                    ? t.id === 'sil'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Fiyat tab */}
          {tab === 'fiyat' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">İşlem</label>
                <select
                  value={priceOp}
                  onChange={(e) => { setPriceOp(e.target.value as BulkOpType); setInputVal('10') }}
                  className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
                >
                  {PRICE_OPS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {currentPriceOpMeta.hasInput && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {inputLabel}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      min="0.01"
                      step={inputType === 'pct' ? '1' : '100'}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      {inputType === 'pct' ? '%' : '₺'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stok tab */}
          {tab === 'stok' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">İşlem</label>
                <select
                  value={stockOp}
                  onChange={(e) => { setStockOp(e.target.value as BulkOpType); setInputVal('10') }}
                  className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
                >
                  {STOCK_OPS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {currentStockOpMeta.hasInput && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {inputLabel}
                  </label>
                  <Input
                    type="number"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Durum tab */}
          {tab === 'durum' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Yeni Durum</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatusOp('set_active')}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    statusOp === 'set_active'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-border text-muted-foreground hover:border-green-300'
                  }`}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setStatusOp('set_passive')}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    statusOp === 'set_passive'
                      ? 'border-gray-400 bg-gray-50 text-gray-600'
                      : 'border-border text-muted-foreground hover:border-gray-300'
                  }`}
                >
                  Pasif
                </button>
              </div>
            </div>
          )}

          {/* Tedarikçi tab */}
          {tab === 'tedarikci' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Yeni Tedarikçi
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
              >
                <option value="">— Tedarikçisiz bırak —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sil tab */}
          {tab === 'sil' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-1">
                <p className="font-semibold">Bu işlem geri alınamaz.</p>
                <p>{count} ürün kalıcı olarak silinecek. Ürünlere ait varyantlar ve parçalar da silinecektir.</p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="accent-red-500 w-4 h-4"
                />
                <span className="text-sm">Evet, {count} ürünü silmek istiyorum</span>
              </label>
            </div>
          )}

          {/* Cascade toggles — fiyat / stok / durum sekmeleri */}
          {(tab === 'fiyat' || tab === 'stok' || tab === 'durum') && (
            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Aynı zamanda uygula</p>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cascadeVariants}
                  onChange={(e) => setCascadeVariants(e.target.checked)}
                  className="accent-[#222222] w-4 h-4"
                />
                <span className="text-sm">Varyantlara da yansıt</span>
                <span className="text-xs text-muted-foreground">(renk, boyut vb.)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cascadeComponents}
                  onChange={(e) => setCascadeComponents(e.target.checked)}
                  className="accent-[#222222] w-4 h-4"
                />
                <span className="text-sm">Parça seçeneklerine de yansıt</span>
                <span className="text-xs text-muted-foreground">(aksesuar, ayak vb.)</span>
              </label>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 leading-relaxed">
              {preview}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
          {tab === 'sil' ? (
            <Button
              type="button"
              onClick={handleDelete}
              disabled={busy || !deleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {busy ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              {count} Ürünü Sil
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleApply}
              disabled={busy || (needsInput && parsedVal <= 0)}
              className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
            >
              {busy ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
              Uygula
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            İptal
          </Button>
        </div>
      </div>
    </div>
  )
}
