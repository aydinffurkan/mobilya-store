'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { saveProduct } from '@/app/admin/urunler/actions'
import VariantManager from '@/components/admin/VariantManager'
import ComponentManager from '@/components/admin/ComponentManager'
import { Category, Product, VariantTemplate } from '@/types'
import { ImagePlus, X, Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Ürün adı en az 2 karakter'),
  slug: z.string().min(2, 'Slug en az 2 karakter'),
  description: z.string().optional(),
  price: z.coerce.number().min(1, 'Fiyat giriniz'),
  sale_price: z.coerce.number().optional(),
  category_id: z.string().min(1, 'Kategori seçiniz'),
  stock: z.coerce.number().min(0),
  is_featured: z.boolean(),
  is_active: z.boolean(),
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

interface Props {
  categories: Category[]
  product?: Product
  variantTemplates?: VariantTemplate[]
}

export default function ProductForm({ categories, product, variantTemplates = [] }: Props) {
  const router = useRouter()
  const isEdit = !!product
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      sale_price: product?.sale_price ?? undefined,
      category_id: product?.category_id ?? '',
      stock: product?.stock ?? 0,
      is_featured: product?.is_featured ?? false,
      is_active: product?.is_active ?? true,
    },
  })

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ı/g, 'i')
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const supabase = createClient()
    const uploaded: string[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from('product-images').upload(path, file)
      if (error) { toast.error(`${file.name} yüklenemedi`); continue }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
      uploaded.push(urlData.publicUrl)
    }

    setImages((prev) => [...prev, ...uploaded])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = async (url: string) => {
    const supabase = createClient()
    const path = url.split('/product-images/')[1]
    if (path) await supabase.storage.from('product-images').remove([path])
    setImages((prev) => prev.filter((u) => u !== url))
  }

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      sale_price: data.sale_price || null,
      images,
    }

    try {
      await saveProduct(isEdit ? product.id : null, payload)
      toast.success(isEdit ? 'Ürün güncellendi' : 'Ürün eklendi')
      router.push('/admin/urunler')
    } catch (e: any) {
      toast.error((isEdit ? 'Güncelleme başarısız: ' : 'Ekleme başarısız: ') + e.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Image upload */}
      <div className="lg:col-span-3 bg-white border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Ürün Görselleri</h3>
          {images.length > 0 && <p className="text-xs text-muted-foreground">İlk görsel kapak resmi olarak kullanılır. Değiştirmek için görsele tıkla.</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 group cursor-pointer ${index === 0 ? 'border-[#8B6914]' : 'border-border'}`}
              onClick={() => setImages((prev) => [url, ...prev.filter((u) => u !== url)])}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-[#8B6914] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Kapak
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(url) }}
                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-[#8B6914] transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-[#8B6914]"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            <span className="text-xs">{uploading ? 'Yükleniyor' : 'Görsel Ekle'}</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Main fields */}
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
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40 resize-none"
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
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Ürün Bilgileri</h3>

          <div className="space-y-1.5">
            <Label htmlFor="category_id">Kategori *</Label>
            <select
              id="category_id"
              {...register('category_id')}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40 bg-background"
            >
              <option value="">Kategori seçin</option>
              {sortCategoriesHierarchical(categories).map(({ category: c, depth }) => (
                <option key={c.id} value={c.id}>
                  {depth > 0 ? '  '.repeat(depth) + '↳ ' : ''}{c.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stock">Stok Adedi *</Label>
            <Input id="stock" type="number" {...register('stock')} min={0} />
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="accent-[#8B6914] w-4 h-4" />
              <span className="text-sm font-medium">Aktif (Sitede görünsün)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('is_featured')} className="accent-[#8B6914] w-4 h-4" />
              <span className="text-sm font-medium">Öne Çıkan Ürün</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={isSubmitting} className="w-full bg-[#8B6914] hover:bg-[#7a5c12] text-white">
            {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ürünü Ekle'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full">
            İptal
          </Button>
        </div>
      </div>

      {isEdit && <VariantManager productId={product.id} variants={product.variants ?? []} templates={variantTemplates} />}
      {isEdit && <ComponentManager productId={product.id} components={product.components ?? []} />}
    </form>
  )
}
