import { createClient } from '@/lib/supabase/server'
import { Category } from '@/types'

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

export async function getTopLevelCategories(): Promise<Pick<Category, 'id' | 'name' | 'slug'>[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .order('name')
    return (data as Pick<Category, 'id' | 'name' | 'slug'>[]) ?? []
  } catch {
    return []
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    return (data as Category) ?? null
  } catch {
    return null
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()
    return (data as Category) ?? null
  } catch {
    return null
  }
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('name')
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

export async function getCategoryIdsBySlug(slug: string): Promise<string[]> {
  const category = await getCategoryBySlug(slug)
  if (!category) return []
  const subcategories = await getSubcategories(category.id)
  return [category.id, ...subcategories.map((s) => s.id)]
}