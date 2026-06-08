import CategoryForm from '@/components/admin/CategoryForm'
import { createClient } from '@/lib/supabase/server'
import { Category } from '@/types'

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

export default async function NewCategoryPage() {
  const categories = await getCategories()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Yeni Kategori Ekle</h1>
        <p className="text-muted-foreground text-sm mt-1">Mağazanıza yeni bir kategori ekleyin</p>
      </div>
      <CategoryForm categories={categories} />
    </div>
  )
}
