import { NextRequest } from 'next/server'
import { ok, badRequest, corsOptions, parseIntParam } from '@/lib/api/helpers'
import { getProductsPage } from '@/lib/repositories/products'
import { getCategoryIdsBySlug } from '@/lib/repositories/categories'
import type { ProductFilters } from '@/lib/repositories/products'

export function OPTIONS() { return corsOptions() }

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  const q = sp.get('q')?.trim() || undefined
  const categorySlug = sp.get('category') || undefined
  const minPrice = sp.get('min') ? Number(sp.get('min')) : undefined
  const maxPrice = sp.get('max') ? Number(sp.get('max')) : undefined
  const sort = (sp.get('sort') ?? 'newest') as ProductFilters['sort']
  const featured = sp.get('featured') === 'true' ? true : undefined
  const limit = parseIntParam(sp.get('limit'), 24)
  const offset = parseIntParam(sp.get('offset'), 0)

  if (limit > 100) return badRequest('limit en fazla 100 olabilir')

  const categoryIds = categorySlug ? await getCategoryIdsBySlug(categorySlug) : undefined

  const result = await getProductsPage({
    q,
    categoryIds,
    minPrice,
    maxPrice,
    sort,
    featured,
    limit,
    offset,
  })

  return ok(result.data, {
    total: result.total,
    limit: result.limit,
    offset: result.offset,
    hasMore: result.offset + result.data.length < result.total,
  })
}