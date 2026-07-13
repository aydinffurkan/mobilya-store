import { NextRequest } from 'next/server'
import { ok, notFound, corsOptions } from '@/lib/api/helpers'
import { getCategoryBySlug, getCategoryById, getSubcategories } from '@/lib/repositories/categories'

export function OPTIONS() { return corsOptions() }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return notFound('Kategori bulunamadı')

  const [parent, subcategories] = await Promise.all([
    category.parent_id ? getCategoryById(category.parent_id) : Promise.resolve(null),
    getSubcategories(category.id),
  ])

  return ok({ category, parent, subcategories })
}