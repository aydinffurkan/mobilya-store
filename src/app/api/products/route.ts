import { NextRequest } from 'next/server'
import { ok, badRequest, corsOptions, parseIntParam } from '@/lib/api/helpers'
import { getProductsPage, getProductFacets } from '@/lib/repositories/products'
import { parseSpecFilters } from '@/lib/productSpecs'
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
  const supplierId = sp.get('supplier') || undefined
  const limit = parseIntParam(sp.get('limit'), 24)
  const offset = parseIntParam(sp.get('offset'), 0)

  if (limit > 100) return badRequest('limit en fazla 100 olabilir')

  const categoryIds = categorySlug ? await getCategoryIdsBySlug(categorySlug) : undefined

  // Renk / Kapak Adedi / Malzeme: ?renk=Beyaz,Ceviz&kapak=3 Kapaklı&malzeme=MDF
  const specFilters = parseSpecFilters((p) => sp.get(p))
  const wantFacets = sp.get('facets') === '1' && offset === 0

  const [result, facets] = await Promise.all([
    getProductsPage({ q, categoryIds, minPrice, maxPrice, sort, featured, supplierId, specFilters, limit, offset }),
    wantFacets
      ? getProductFacets({ q, categoryIds, minPrice, maxPrice, featured, supplierId, specFilters })
      : Promise.resolve(undefined),
  ])

  return ok(result.data, {
    total: result.total,
    limit: result.limit,
    offset: result.offset,
    hasMore: result.offset + result.data.length < result.total,
    ...(facets ? { facets } : {}),
  })
}