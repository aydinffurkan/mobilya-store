import { notFound } from 'next/navigation'
import CategoryForm from '@/components/admin/CategoryForm'
import CategoryPromoManager from '@/components/admin/CategoryPromoManager'
import { createClient } from '@/lib/supabase/server'
import { Category } from '@/types'

async function getCategory(id: string): Promise<Category | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').eq('id', id).single()
    return (data as Category) ?? null
  } catch {
    return null
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [category, categories] = await Promise.all([getCategory(id), getCategories()])

  if (!category) notFound()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kategoriyi Düzenle</h1>
        <p className="text-muted-foreground text-sm mt-1">{category.name}</p>
      </div>
      <div className="space-y-6">
        <CategoryForm category={category} categories={categories} />
        <CategoryPromoManager categoryId={category.id} cards={category.promo_cards ?? []} />
      </div>
    </div>
  )
}
