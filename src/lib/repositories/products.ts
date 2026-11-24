import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { getSpecOptions } from '@/lib/repositories/specOptions'
import { FILTERABLE_SPECS, makeTag } from '@/lib/productSpecs'
import type { FacetGroup, FacetOption } from '@/lib/productSpecs'

const PRODUCT_SELECT = '*, category:categories(*), variants:product_variants(id, attributes, stock, is_active)'

/** URL parametresi (renk | kapak | malzeme) → seçili değerler */
export type SpecFilters = Record<string, string[]>

export interface ProductFilters {
  /** Renk / Kapak Adedi / Malzeme seçimleri */
  specFilters?: SpecFilters
  q?: string
  categoryIds?: string[]
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'featured'
  featured?: boolean
  cartDiscount?: number
  supplierId?: string
  limit?: number
  offset?: number
}

export interface ProductsPage {
  data: Product[]
  total: number
  limit: number
  offset: number
}

export interface CategoryProductTab {
  id: string
  name: string
  slug: string
  products: Product[]
}

export async function getCategoryProductTabs(maxCategories = 6, perCategory = 12): Promise<CategoryProductTab[]> {
  try {
    const supabase = await createClient()
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('created_at', { ascending: true })

    if (!categories?.length) return []

    const tabs = await Promise.all(
      categories.map(async (cat) => {
        const { data: products } = await supabase
          .from('products')
          .select(PRODUCT_SELECT)
          .eq('category_id', cat.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(perCategory)
        return { ...cat, products: (products as Product[]) ?? [] }
      })
    )

    return tabs.filter((t) => t.products.length > 0).slice(0, maxCategories)
  } catch {
    return []
  }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data as Product[]) ?? []
  } catch {
    return []
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const page = await getProductsPage(filters)
  return page.data
}

type BaseFilters = Pick<ProductFilters, 'q' | 'categoryIds' | 'minPrice' | 'maxPrice' | 'featured' | 'cartDiscount' | 'supplierId'>

/** Özellik filtrelerinin (Renk/Kapak/Malzeme) dışındaki ortak filtreleri uygular */
async function buildBaseQuery(
  supabase: SupabaseClient,
  select: string,
  options: { count?: 'exact' } | undefined,
  f: BaseFilters
) {
  const { q, categoryIds, minPrice, maxPrice, featured, cartDiscount, supplierId } = f
  // select dinamik olduğundan tip çıkarımı için '*' olarak daraltılır (satırlar any döner)
  let query = supabase.from('products').select(select as '*', options).eq('is_active', true)

  if (q) {
    const { data: matchingSuppliers } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', `%${q}%`)
    const supplierIds = matchingSuppliers?.map((s: { id: string }) => s.id) ?? []
    if (supplierIds.length > 0) {
      query = query.or(`name.ilike.%${q}%,supplier_id.in.(${supplierIds.join(',')})`)
    } else {
      query = query.ilike('name', `%${q}%`)
    }
  }
  if (categoryIds?.length) query = query.in('category_id', categoryIds)
  if (minPrice !== undefined) query = query.gte('price', minPrice)
  if (maxPrice !== undefined) query = query.lte('price', maxPrice)
  if (featured) query = query.eq('is_featured', true)
  if (cartDiscount !== undefined) query = query.eq('cart_discount_percent', cartDiscount)
  if (supplierId) query = query.eq('supplier_id', supplierId)
  // Not: builder "thenable"dır; async fonksiyondan doğrudan dönmek sorguyu çalıştırır, bu yüzden sarılır
  return { query }
}

/**
 * Filtre çubuğu için seçenek adetleri. Her grubun adedi, DİĞER gruplardaki seçimler
 * uygulanarak hesaplanır (kendi grubundaki seçim adedi daraltmaz).
 */
export async function getProductFacets(filters: BaseFilters & { specFilters?: SpecFilters }): Promise<FacetGroup[]> {
  try {
    const supabase = await createClient()
    const [options, { data }] = await Promise.all([
      getSpecOptions(supabase),
      (await buildBaseQuery(supabase, 'filter_tags', undefined, filters)).query.limit(5000),
    ])
    const rows = ((data ?? []) as unknown as { filter_tags: string[] | null }[]).map((r) => r.filter_tags ?? [])
    const selected = filters.specFilters ?? {}

    const groups: FacetGroup[] = []
    for (const def of FILTERABLE_SPECS) {
      // Diğer gruplardaki seçimleri uygula
      const matching = rows.filter((tags) =>
        FILTERABLE_SPECS.every((other) => {
          if (other.param === def.param) return true
          const sel = selected[other.param]
          return !sel?.length || sel.some((v) => tags.includes(makeTag(other.param, v)))
        })
      )

      const counts = new Map<string, number>()
      const prefix = `${def.param}:`
      for (const tags of matching) {
        for (const t of tags) if (t.startsWith(prefix)) counts.set(t.slice(prefix.length), (counts.get(t.slice(prefix.length)) ?? 0) + 1)
      }

      const defined = options.filter((o) => o.spec_key === def.key)
      const known = new Set(defined.map((o) => o.value))
      const result: FacetOption[] = defined.map((o) => ({ value: o.value, count: counts.get(o.value) ?? 0, color_hex: o.color_hex }))
      // Listede olmayan ama ürünlerde geçen değerler de görünsün
      for (const [value, count] of counts) if (!known.has(value)) result.push({ value, count })

      const visible = result.filter((o) => o.count > 0 || (selected[def.param] ?? []).includes(o.value))
      if (visible.some((o) => o.count > 0)) groups.push({ param: def.param, label: def.label, options: visible })
    }
    return groups
  } catch {
    return []
  }
}

export async function getProductsPage(filters: ProductFilters = {}): Promise<ProductsPage> {
  try {
    const supabase = await createClient()
    const { sort = 'newest', specFilters, limit = 24, offset = 0 } = filters

    let { query } = await buildBaseQuery(supabase, PRODUCT_SELECT, { count: 'exact' }, filters)

    // Aynı grup içinde VEYA (etiketlerden herhangi biri), gruplar arası VE
    for (const def of FILTERABLE_SPECS) {
      const values = specFilters?.[def.param]
      if (values?.length) query = query.overlaps('filter_tags', values.map((v) => makeTag(def.param, v)))
    }

    if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else if (sort === 'featured') query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
    else query = query.order('created_at', { ascending: false })

    query = query.range(offset, offset + limit - 1)

    const { data, count } = await query
    return { data: (data as Product[]) ?? [], total: count ?? 0, limit, offset }
  } catch {
    return { data: [], total: 0, limit: 24, offset: 0 }
  }
}

export async function getAlternativeProducts(
  productId: string,
  categoryId: string,
  price: number,
  limit = 6
): Promise<Product[]> {
  try {
    const supabase = await createClient()
    // Fetch a broader set from the same category, exclude current product
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('category_id', categoryId)
      .neq('id', productId)
      .eq('is_active', true)
      .limit(40)
    if (!data?.length) return []
    // Sort by price proximity in JS
    return (data as Product[])
      .sort((a, b) => Math.abs(a.price - price) - Math.abs(b.price - price))
      .slice(0, limit)
  } catch {
    return []
  }
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .in('id', ids)
      .eq('is_active', true)
    if (!data) return []
    // preserve the caller's ordering (localStorage order = most-recent first)
    const byId = new Map((data as Product[]).map((p) => [p.id, p]))
    return ids.map((id) => byId.get(id)).filter(Boolean) as Product[]
  } catch {
    return []
  }
}

export async function getCartUpsellProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()

    // Admin tarafından seçilmiş ürün ID'leri
    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'cart_upsell')
      .single()

    const productIds: string[] = (setting?.value as { product_ids?: string[] } | null)?.product_ids ?? []

    if (productIds.length > 0) {
      const { data } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .in('id', productIds)
        .eq('is_active', true)
      if (data?.length) {
        const byId = new Map((data as Product[]).map((p) => [p.id, p]))
        return productIds.map((id) => byId.get(id)).filter(Boolean) as Product[]
      }
    }

    // Fallback: en uygun fiyatlı 10 aktif ürün
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('price', { ascending: true })
      .limit(10)
    return (data as Product[]) ?? []
  } catch {
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    return (data as Product) ?? null
  } catch {
    return null
  }
}