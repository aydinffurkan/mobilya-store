'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/types'

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

interface Props {
  categories: Category[]
  product?: Product
}

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter()
  const isEdit = !!product

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<FormData>({
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

  const nameValue = watch('name')

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ı/g, 'i')
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()

    const payload = {
      ...data,
      sale_price: data.sale_price || null,
      images: product?.images ?? [],
      updated_at: new Date().toISOString(),
    }

    if (isEdit) {
      const { error } = await supabase.from('products').update(payload).eq('id', product.id)
      if (error) { toast.error('Güncelleme başarısız: ' + error.message); return }
      toast.success('Ürün güncellendi')
    } else {
      const { error } = await supabase.from('products').insert({ ...payload, created_at: new Date().toISOString() })
      if (error) { toast.error('Ekleme başarısız: ' + error.message); return }
      toast.success('Ürün eklendi')
    }

    router.push('/admin/urunler')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="grid grid-cols-2 gap-4">
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
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
    </form>
  )
}
