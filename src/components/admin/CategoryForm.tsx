'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveCategory } from '@/app/admin/kategoriler/actions'
import { Category } from '@/types'

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

  const onSubmit = async (data: FormData) => {
    try {
      await saveCategory(isEdit ? category.id : null, { ...data, parent_id: data.parent_id || null })
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
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40 bg-background"
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
          <Label htmlFor="description">Açıklama</Label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40 resize-none"
            placeholder="Kategori açıklaması..."
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={isSubmitting} className="bg-[#8B6914] hover:bg-[#7a5c12] text-white">
          {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kategori Ekle'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          İptal
        </Button>
      </div>
    </form>
  )
}
