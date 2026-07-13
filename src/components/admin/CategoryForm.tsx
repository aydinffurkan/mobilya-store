'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveCategory } from '@/app/admin/kategoriler/actions'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'
import { ImagePlus, X, Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Kategori adı en az 2 karakter'),
  slug: z.string().min(2, 'Slug en az 2 karakter'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CategoryForm({ category, categories = [] }: { category?: Category; categories?: Category[] }) {
  const router = useRouter()
  const isEdit = !!category
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Kendisi ve kendi alt kategorileri üst kategori olarak seçilemesin (döngü oluşmasın)
  const excludedIds = new Set<string>()
  if (isEdit) {
    excludedIds.add(category.id)
    let added = true
    while (added) {
      added = false
      for (const c of categories) {
        if (c.parent_id && excludedIds.has(c.parent_id) && !excludedIds.has(c.id)) {
          excludedIds.add(c.id)
          added = true
        }
      }
    }
  }
  const parentOptions = categories.filter((c) => !excludedIds.has(c.id))

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      parent_id: category?.parent_id ?? '',
    },
  })

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ı/g, 'i')
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o')
      .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `category-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) {
      toast.error('Görsel yüklenemedi')
    } else {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
      setImageUrl(urlData.publicUrl)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = async () => {
    if (!imageUrl) return
    const supabase = createClient()
    const path = imageUrl.split('/product-images/')[1]
    if (path) await supabase.storage.from('product-images').remove([path])
    setImageUrl(null)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await saveCategory(isEdit ? category.id : null, { ...data, parent_id: data.parent_id || null, image_url: imageUrl })
      toast.success(isEdit ? 'Kategori güncellendi' : 'Kategori eklendi')
      router.push('/admin/kategoriler')
    } catch (e: any) {
      toast.error((isEdit ? 'Güncelleme başarısız: ' : 'Ekleme başarısız: ') + e.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl">
      <div className="bg-white border border-border rounded-2xl p-5 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Kategori Adı *</Label>
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
          <Input id="slug" {...register('slug')} placeholder="ornek-kategori" />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parent_id">Üst Kategori (opsiyonel)</Label>
          <select
            id="parent_id"
            {...register('parent_id')}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 bg-background"
          >
            <option value="">— Ana kategori (üst kategorisi yok) —</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Bir üst kategori seçerseniz bu kategori onun alt kategorisi olur. Müşteri üst kategoriye girdiğinde alt kategorilerindeki ürünler de gösterilir.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Görsel</Label>
          <p className="text-xs text-muted-foreground">Anasayfadaki "En Gözde Kategorilerimiz" bölümünde bu görsel kullanılır.</p>
          {imageUrl ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border group">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-32 h-32 rounded-xl border-2 border-dashed border-border hover:border-[#222222] transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-[#222222]"
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
              <span className="text-xs">{uploading ? 'Yükleniyor' : 'Görsel Ekle'}</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Açıklama</Label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none"
            placeholder="Kategori açıklaması..."
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={isSubmitting} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kategori Ekle'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
      </div>
    </form>
  )
}
