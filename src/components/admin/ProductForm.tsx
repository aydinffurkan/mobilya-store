'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { saveProduct, saveProductDetailFields } from '@/app/admin/urunler/actions'
import VariantManager from '@/components/admin/VariantManager'
import ComponentManager from '@/components/admin/ComponentManager'
import {
  Category, Product, ProductSpec, ProductDimension, FAQItem,
  VariantTemplate, ComponentTemplate, DimensionTemplate, SpecTemplate, FAQTemplate, Supplier,
} from '@/types'
import { ImagePlus, X, Loader2, Pencil, Plus, GripVertical, ZoomIn } from 'lucide-react'
import ImageEditor from '@/components/shared/ImageEditor'
import { fetchAsObjectUrl } from '@/lib/utils/imageProcessing'

const schema = z.object({
  name:        z.string().min(2, 'Ürün adı en az 2 karakter'),
  slug:        z.string().min(2, 'Slug en az 2 karakter'),
  description: z.string().optional(),
  price:       z.coerce.number().min(1, 'Fiyat giriniz'),
  sale_price:       z.coerce.number().optional(),
  category_id: z.string().min(1, 'Kategori seçiniz'),
  supplier_id: z.string().optional(),
  stock:       z.coerce.number().min(0),
  is_featured: z.boolean(),
  is_active:   z.boolean(),
  installment_count: z.coerce.number().optional(),
  fast_delivery:      z.boolean(),
})

type FormData = z.infer<typeof schema>

function sortCategoriesHierarchical(categories: Category[]): { category: Category; depth: number }[] {
  const byParent = new Map<string | null, Category[]>()
  for (const c of categories) {
    const key = c.parent_id ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }
  const result: { category: Category; depth: number }[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const c of byParent.get(parentId) ?? []) {
      result.push({ category: c, depth })
      walk(c.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

type TabId = 'genel' | 'gorseller' | 'detaylar' | 'varyantlar' | 'parcalar'

interface Props {
  categories: Category[]
  suppliers?: Supplier[]
  product?: Product
  variantTemplates?: VariantTemplate[]
  componentTemplates?: ComponentTemplate[]
  dimensionTemplates?: DimensionTemplate[]
  specTemplates?: SpecTemplate[]
  faqTemplates?: FAQTemplate[]
}

export default function ProductForm({
  categories,
  suppliers = [],
  product,
  variantTemplates = [],
  componentTemplates = [],
  dimensionTemplates = [],
  specTemplates = [],
  faqTemplates = [],
}: Props) {
  const router  = useRouter()
  const isEdit  = !!product

  // ── Tab ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('genel')

  const TABS: { id: TabId; label: string; show: boolean }[] = [
    { id: 'genel',      label: 'Genel Bilgiler', show: true   },
    { id: 'gorseller',  label: 'Görseller',       show: isEdit },
    { id: 'detaylar',   label: 'Detaylar',        show: isEdit },
    { id: 'varyantlar', label: 'Varyantlar',      show: isEdit },
    { id: 'parcalar',   label: 'Parçalar',        show: isEdit },
  ]

  // ── Görseller ────────────────────────────────────────────────────────────
  const [images,      setImages]      = useState<string[]>(product?.images ?? [])
  const [uploading,   setUploading]   = useState(false)
  const [editorState, setEditorState] = useState<{ src: string; existingUrl?: string } | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag-and-drop state
  const [dragIdx,     setDragIdx]     = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const handleImgDragStart = (i: number) => setDragIdx(i)
  const handleImgDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    setDragOverIdx(i)
  }
  const handleImgDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null); setDragOverIdx(null); return
    }
    const next = [...images]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    setImages(next)
    setDragIdx(null)
    setDragOverIdx(null)
  }
  const handleImgDragEnd = () => { setDragIdx(null); setDragOverIdx(null) }

  const uploadBlob = async (blob: Blob): Promise<string> => {
    const supabase = createClient()
    const ext  = blob.type === 'image/png' ? 'png' : 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const file = new File([blob], path, { type: blob.type })
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) throw new Error(error.message)
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
    return urlData.publicUrl
  }

  const handleEditorSave = async (blob: Blob) => {
    const existing = editorState?.existingUrl
    setEditorState(null)
    setUploading(true)
    try {
      if (existing) {
        const supabase = createClient()
        const path = existing.split('/product-images/')[1]?.split('?')[0]
        if (path) await supabase.storage.from('product-images').remove([path])
      }
      const url = await uploadBlob(blob)
      setImages((prev) => existing ? prev.map((u) => (u === existing ? url : u)) : [...prev, url])
    } catch (e: unknown) {
      toast.error('Yüklenemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setUploading(false)
    }
  }

  const openEditorWithFile = (file: File) => setEditorState({ src: URL.createObjectURL(file) })

  const openEditorWithExisting = async (url: string) => {
    try {
      const objectUrl = await fetchAsObjectUrl(url)
      setEditorState({ src: objectUrl, existingUrl: url })
    } catch {
      setEditorState({ src: url, existingUrl: url })
    }
  }

  const uploadFilesDirectly = async (files: File[]) => {
    setUploading(true)
    const urls: string[] = []
    try {
      for (const file of files) {
        const url = await uploadBlob(file)
        urls.push(url)
      }
      setImages((prev) => [...prev, ...urls])
    } catch (e: unknown) {
      toast.error('Yüklenemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setUploading(false)
    }
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length === 1) openEditorWithFile(files[0])
    else if (files.length > 1) uploadFilesDirectly(files)
  }, [])

  const removeImage = async (url: string) => {
    const supabase = createClient()
    const path = url.split('/product-images/')[1]
    if (path) await supabase.storage.from('product-images').remove([path])
    setImages((prev) => prev.filter((u) => u !== url))
  }

  // ── Sepette indirim ──────────────────────────────────────────────────────
  const [cartDiscountPct, setCartDiscountPct] = useState<number | null>(product?.cart_discount_percent ?? null)

  // ── Detaylar ─────────────────────────────────────────────────────────────
  const [featuredSpecs,    setFeaturedSpecs]    = useState<string[]>(product?.featured_specs ?? [])
  const [newFeaturedSpec,  setNewFeaturedSpec]  = useState('')
  const [specs,            setSpecs]            = useState<ProductSpec[]>(product?.specs ?? [])
  const [dimensions,       setDimensions]       = useState<ProductDimension[]>(product?.dimensions ?? [])
  const [faqItems,         setFaqItems]         = useState<FAQItem[]>(product?.faq_items ?? [])
  const [isSavingDetail,   setIsSavingDetail]   = useState(false)

  const addFeaturedSpec  = () => {
    const v = newFeaturedSpec.trim()
    if (!v) return
    setFeaturedSpecs((p) => [...p, v])
    setNewFeaturedSpec('')
  }
  const removeFeaturedSpec = (i: number) => setFeaturedSpecs((p) => p.filter((_, idx) => idx !== i))

  const addSpec    = () => setSpecs((p) => [...p, { key: '', value: '' }])
  const updateSpec = (i: number, field: 'key' | 'value', val: string) =>
    setSpecs((p) => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  const removeSpec = (i: number) => setSpecs((p) => p.filter((_, idx) => idx !== i))

  const addDimension    = () => setDimensions((p) => [...p, { name: '', width: '', depth: '', height: '' }])
  const updateDimension = (i: number, field: keyof ProductDimension, val: string) =>
    setDimensions((p) => p.map((d, idx) => idx === i ? { ...d, [field]: val } : d))
  const removeDimension = (i: number) => setDimensions((p) => p.filter((_, idx) => idx !== i))

  const addFaq    = () => setFaqItems((p) => [...p, { q: '', a: '' }])
  const updateFaq = (i: number, field: keyof FAQItem, val: string) =>
    setFaqItems((p) => p.map((f, idx) => idx === i ? { ...f, [field]: val } : f))
  const removeFaq = (i: number) => setFaqItems((p) => p.filter((_, idx) => idx !== i))

  const handleSaveDetail = async () => {
    if (!product?.id) return
    setIsSavingDetail(true)
    try {
      await saveProductDetailFields(product.id, {
        featured_specs: featuredSpecs,
        specs: specs.filter((s) => s.key.trim()),
        dimensions: dimensions.filter((d) => d.name.trim()),
        faq_items: faqItems.filter((f) => f.q.trim()),
      })
      toast.success('Detay bilgileri kaydedildi')
    } catch (e: unknown) {
      toast.error('Kayıt başarısız: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setIsSavingDetail(false)
    }
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      name:        product?.name        ?? '',
      slug:        product?.slug        ?? '',
      description: product?.description ?? '',
      price:       product?.price       ?? 0,
      sale_price:       product?.sale_price       ?? undefined,
      category_id: product?.category_id ?? '',
      supplier_id: product?.supplier_id ?? '',
      stock:       product?.stock       ?? 0,
      is_featured: product?.is_featured ?? false,
      is_active:   product?.is_active   ?? true,
      installment_count: product?.installment_count ?? undefined,
      fast_delivery:      product?.fast_delivery      ?? false,
    },
  })

  const autoSlug = (name: string) =>
    name.toLowerCase()
      .replace(/ç/g,'c').replace(/ş/g,'s').replace(/ı/g,'i')
      .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o')
      .replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      sale_price:            data.sale_price || null,
      installment_count:     data.installment_count || null,
      supplier_id:           data.supplier_id || null,
      cart_discount_percent: cartDiscountPct,
      images,
      featured_specs: featuredSpecs,
      specs:          specs.filter((s) => s.key.trim()),
      dimensions:     dimensions.filter((d) => d.name.trim()),
    }
    try {
      const result = await saveProduct(isEdit ? product.id : null, payload)
      if (isEdit) {
        toast.success('Ürün güncellendi')
        router.push('/admin/urunler')
      } else {
        toast.success('Ürün eklendi — şimdi sekmeleri kullanarak detayları doldurun')
        router.push(`/admin/urunler/${result.id}`)
      }
    } catch (e: unknown) {
      toast.error((isEdit ? 'Güncelleme başarısız: ' : 'Ekleme başarısız: ') + (e instanceof Error ? e.message : String(e)))
    }
  }

  const triggerSubmit = () => handleSubmit(onSubmit)()

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0">

      {/* ── Sticky tab bar ── */}
      <div className="sticky top-0 z-20 bg-background border-b border-border flex items-center gap-0 -mx-6 px-6 mb-6">
        <div className="flex gap-0 flex-1 overflow-x-auto">
          {TABS.filter((t) => t.show).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-[#222222] text-[#222222]'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Global save button */}
        {(activeTab === 'genel' || activeTab === 'gorseller') && (
          <div className="flex items-center gap-2 pl-4 flex-shrink-0">
            <Button
              type="button"
              onClick={triggerSubmit}
              disabled={isSubmitting}
              className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
              size="sm"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin mr-1.5" />}
              {isSubmitting ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Ürünü Ekle'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
              İptal
            </Button>
          </div>
        )}
        {activeTab === 'detaylar' && isEdit && (
          <div className="pl-4 flex-shrink-0">
            <Button
              type="button"
              size="sm"
              disabled={isSavingDetail}
              onClick={handleSaveDetail}
              className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
            >
              {isSavingDetail && <Loader2 size={13} className="animate-spin mr-1.5" />}
              {isSavingDetail ? 'Kaydediliyor…' : 'Detayları Kaydet'}
            </Button>
          </div>
        )}
      </div>

      {/* ── Form wraps Genel + Görseller + Detaylar ── */}
      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ━━ TAB: Genel ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className={activeTab !== 'genel' ? 'hidden' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>

          {/* Ana alanlar */}
          <div className="lg:col-span-2 space-y-5 bg-white border border-border rounded-2xl p-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input
                id="name"
                {...register('name')}
                onChange={(e) => {
                  register('name').onChange(e)
                  if (!isEdit) setValue('slug', autoSlug(e.target.value))
                }}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input id="slug" {...register('slug')} placeholder="ornek-urun-adi" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <textarea
                id="description"
                {...register('description')}
                rows={5}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none"
                placeholder="Ürün açıklaması..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Fiyat (₺) *</Label>
                <Input id="price" type="number" {...register('price')} min={0} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sale_price">İndirimli Fiyat (₺)</Label>
                <Input id="sale_price" type="number" {...register('sale_price')} min={0} placeholder="Opsiyonel" />
              </div>
            </div>


            {/* Sepette İndirim */}
            <div className="space-y-2">
              <Label>Sepette İndirim</Label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Müşteri sepete eklediğinde otomatik uygulanır. Ürün kartında rozet gösterilir.
              </p>
              <div className="flex gap-2 flex-wrap">
                {([null, 5, 10, 15, 20] as (number | null)[]).map((pct) => {
                  const activeClass = pct === null
                    ? 'bg-[#222222] text-white border-[#222222]'
                    : pct >= 20 ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-500'
                    : pct >= 15 ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white border-purple-500'
                    : pct >= 10 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-orange-400'
                    : 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white border-teal-400'
                  return (
                    <button
                      key={pct ?? 'none'}
                      type="button"
                      onClick={() => setCartDiscountPct(pct)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                        cartDiscountPct === pct ? activeClass : 'bg-white text-neutral-600 border-border hover:border-neutral-300'
                      }`}
                    >
                      {pct === null ? 'Yok' : `%${pct}`}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm">Ürün Bilgileri</h3>

              <div className="space-y-1.5">
                <Label htmlFor="category_id">Kategori *</Label>
                <select
                  id="category_id"
                  {...register('category_id')}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 bg-background"
                >
                  <option value="">Kategori seçin</option>
                  {sortCategoriesHierarchical(categories).map(({ category: c, depth }) => (
                    <option key={c.id} value={c.id}>
                      {depth > 0 ? '  '.repeat(depth) + '↳ ' : ''}{c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
              </div>

              {suppliers.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="supplier_id">Tedarikçi</Label>
                  <select
                    id="supplier_id"
                    {...register('supplier_id')}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 bg-background"
                  >
                    <option value="">— Seçilmedi —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="stock">Stok Adedi *</Label>
                <Input id="stock" type="number" {...register('stock')} min={0} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="installment_count">Taksit Sayısı</Label>
                <Input id="installment_count" type="number" {...register('installment_count')} min={0} placeholder="Opsiyonel, örn: 9" />
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" {...register('is_active')} className="accent-[#222222] w-4 h-4" />
                  <span className="text-sm font-medium">Aktif (Sitede görünsün)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" {...register('is_featured')} className="accent-[#222222] w-4 h-4" />
                  <span className="text-sm font-medium">Öne Çıkan Ürün</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" {...register('fast_delivery')} className="accent-[#222222] w-4 h-4" />
                  <span className="text-sm font-medium">Hızlı Teslimat</span>
                </label>
              </div>
            </div>

            {!isEdit && (
              <p className="text-xs text-muted-foreground bg-muted/40 border border-dashed border-border rounded-xl p-4">
                Ürünü kaydettikten sonra Görseller, Detaylar, Varyantlar ve Parçalar sekmeleri aktif olacak.
              </p>
            )}
          </div>
        </div>

        {/* ━━ TAB: Görseller ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className={activeTab !== 'gorseller' ? 'hidden' : 'bg-white border border-border rounded-2xl p-6'}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Ürün Görselleri</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sürükleyerek sırala · İlk görsel kapak · Kalem ile düzenle · Çoklu seçimde doğrudan yüklenir
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-sm text-[#222222] hover:underline disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              Görsel Ekle
            </button>
          </div>

          {/* Grid: draggable thumbnails */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {images.map((url, index) => (
              <div
                key={url}
                draggable
                onDragStart={() => handleImgDragStart(index)}
                onDragOver={(e) => handleImgDragOver(e, index)}
                onDrop={() => handleImgDrop(index)}
                onDragEnd={handleImgDragEnd}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${
                  index === 0
                    ? 'border-[#222222]'
                    : dragOverIdx === index && dragIdx !== index
                    ? 'border-blue-400 border-dashed scale-105'
                    : 'border-border'
                } ${dragIdx === index ? 'opacity-40 scale-95' : ''}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />

                {/* Kapak etiketi */}
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-[#222222] text-white text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                    Kapak
                  </div>
                )}

                {/* Drag handle indicator */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/40 rounded p-0.5">
                    <GripVertical size={12} className="text-white" />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="absolute inset-0 flex items-end justify-end gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); setLightboxUrl(url) }}
                    className="bg-white rounded-full p-1 shadow hover:scale-110 transition-transform"
                  >
                    <ZoomIn size={10} className="text-gray-500" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); openEditorWithExisting(url) }}
                    className="bg-white rounded-full p-1 shadow hover:scale-110 transition-transform"
                  >
                    <Pencil size={10} className="text-[#222222]" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); removeImage(url) }}
                    className="bg-white rounded-full p-1 shadow hover:scale-110 transition-transform"
                  >
                    <X size={10} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            {/* Upload drop zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-[#222222] transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-[#222222]"
            >
              {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
              <span className="text-[10px] font-medium">{uploading ? 'Yükleniyor' : 'Ekle'}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length === 1) openEditorWithFile(files[0])
              else if (files.length > 1) uploadFilesDirectly(files)
              e.target.value = ''
            }}
          />

          {editorState && (
            <ImageEditor
              src={editorState.src}
              onSave={handleEditorSave}
              onCancel={() => setEditorState(null)}
            />
          )}
        </div>

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
            <img
              src={lightboxUrl}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ━━ TAB: Detaylar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className={activeTab !== 'detaylar' ? 'hidden' : 'bg-white border border-border rounded-2xl p-6 space-y-8'}>

          {/* Öne Çıkan Özellikler */}
          <section className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-0.5">Öne Çıkan Özellikler</h4>
              <p className="text-xs text-muted-foreground">Ürün sayfasında rozet olarak görünen kısa etiketler. Örn: "2 Yıl Garantili", "Bazalı"</p>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {featuredSpecs.map((spec, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-[#222222]/10 text-[#222222] rounded-full px-3 py-1 text-sm font-medium">
                  {spec}
                  <button type="button" onClick={() => removeFeaturedSpec(i)} className="hover:text-red-500 leading-none">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="örn: Randevulu Teslimat"
                value={newFeaturedSpec}
                onChange={(e) => setNewFeaturedSpec(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeaturedSpec() } }}
                className="max-w-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addFeaturedSpec}>
                <Plus size={14} className="mr-1" /> Ekle
              </Button>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Ürün Özellikleri */}
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-0.5">Ürün Özellikleri (Teknik Tablo)</h4>
                <p className="text-xs text-muted-foreground">Özellik adı + değer çiftlerinden oluşan teknik tablo.</p>
              </div>
              {specTemplates.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const t = specTemplates.find((t) => t.id === e.target.value)
                    if (t) { setSpecs(t.items.map((i) => ({ ...i }))); e.target.value = '' }
                  }}
                  className="flex-shrink-0 text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-[#222222]/40 cursor-pointer"
                >
                  <option value="">Şablon Uygula…</option>
                  {specTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
            {specs.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground w-2/5">Özellik Adı</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Değer</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {specs.map((spec, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2">
                          <Input value={spec.key} onChange={(e) => updateSpec(i, 'key', e.target.value)} placeholder="Yatak Ölçüsü" className="h-8 text-sm" />
                        </td>
                        <td className="py-1.5 px-2">
                          <Input value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} placeholder="160x200 cm" className="h-8 text-sm" />
                        </td>
                        <td className="py-1.5 pr-2 text-center">
                          <button type="button" onClick={() => removeSpec(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={addSpec}>
              <Plus size={14} className="mr-1" /> Satır Ekle
            </Button>
          </section>

          <div className="border-t border-border" />

          {/* Ürün Boyutları */}
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-0.5">Ürün Boyutları</h4>
                <p className="text-xs text-muted-foreground">Her parça için genişlik / derinlik / yükseklik.</p>
              </div>
              {dimensionTemplates.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const t = dimensionTemplates.find((t) => t.id === e.target.value)
                    if (t) { setDimensions(t.items.map((i) => ({ ...i }))); e.target.value = '' }
                  }}
                  className="flex-shrink-0 text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-[#222222]/40 cursor-pointer"
                >
                  <option value="">Şablon Uygula…</option>
                  {dimensionTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
            {dimensions.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Ürün Adı</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Genişlik</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Derinlik</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Yükseklik</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dimensions.map((dim, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2"><Input value={dim.name}   onChange={(e) => updateDimension(i,'name',  e.target.value)} placeholder="LINE BAZA" className="h-8 text-sm" /></td>
                        <td className="py-1.5 px-2"><Input value={dim.width}  onChange={(e) => updateDimension(i,'width', e.target.value)} placeholder="160 cm"    className="h-8 text-sm" /></td>
                        <td className="py-1.5 px-2"><Input value={dim.depth}  onChange={(e) => updateDimension(i,'depth', e.target.value)} placeholder="200 cm"    className="h-8 text-sm" /></td>
                        <td className="py-1.5 px-2"><Input value={dim.height} onChange={(e) => updateDimension(i,'height',e.target.value)} placeholder="28 cm"     className="h-8 text-sm" /></td>
                        <td className="py-1.5 pr-2 text-center">
                          <button type="button" onClick={() => removeDimension(i)} className="text-muted-foreground hover:text-red-500 transition-colors"><X size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={addDimension}>
              <Plus size={14} className="mr-1" /> Satır Ekle
            </Button>
          </section>

          <div className="border-t border-border" />

          {/* SSS */}
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-0.5">Sıkça Sorulan Sorular (SSS)</h4>
                <p className="text-xs text-muted-foreground">Ürün sayfasında SSS bölümünde gösterilir.</p>
              </div>
              {faqTemplates.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const t = faqTemplates.find((t) => t.id === e.target.value)
                    if (t) { setFaqItems(t.items.map((i) => ({ ...i }))); e.target.value = '' }
                  }}
                  className="flex-shrink-0 text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-[#222222]/40 cursor-pointer"
                >
                  <option value="">Şablon Uygula…</option>
                  {faqTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-2">
              {faqItems.map((faq, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={faq.q}
                        onChange={(e) => updateFaq(i, 'q', e.target.value)}
                        placeholder="Soru..."
                        className="h-8 text-sm"
                      />
                      <textarea
                        value={faq.a}
                        onChange={(e) => updateFaq(i, 'a', e.target.value)}
                        placeholder="Cevap..."
                        rows={2}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none"
                      />
                    </div>
                    <button type="button" onClick={() => removeFaq(i)} className="mt-1 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFaq}>
              <Plus size={14} className="mr-1" /> Soru Ekle
            </Button>
          </section>
        </div>

      </form>{/* end form */}

      {/* ━━ TAB: Varyantlar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isEdit && (
        <div className={activeTab !== 'varyantlar' ? 'hidden' : ''}>
          <VariantManager productId={product.id} variants={product.variants ?? []} templates={variantTemplates} />
        </div>
      )}

      {/* ━━ TAB: Parçalar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isEdit && (
        <div className={activeTab !== 'parcalar' ? 'hidden' : ''}>
          <ComponentManager productId={product.id} components={product.components ?? []} templates={componentTemplates} />
        </div>
      )}

    </div>
  )
}