import Link from 'next/link'
import ProductGrid from '@/components/products/ProductGrid'
import { getTopLevelCategories, getCategoryIdsBySlug } from '@/lib/repositories/categories'
import { getProductsPage } from '@/lib/repositories/products'
import type { ProductFilters } from '@/lib/repositories/products'

interface SearchParams {
  q?: string
  category?: string
  min?: string
  max?: string
  sort?: string
  sepette_indirim?: string
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const categorySlug = params.category ?? ''
  const minPrice = params.min ? Number(params.min) : undefined
  const maxPrice = params.max ? Number(params.max) : undefined
  const sort = (params.sort ?? 'newest') as ProductFilters['sort']
  const cartDiscount = params.sepette_indirim ? Number(params.sepette_indirim) : undefined

  const [categories, categoryIds] = await Promise.all([
    getTopLevelCategories(),
    categorySlug ? getCategoryIdsBySlug(categorySlug) : Promise.resolve([] as string[]),
  ])

  const page = await getProductsPage({
    q: q || undefined,
    categoryIds: categoryIds.length ? categoryIds : undefined,
    minPrice,
    maxPrice,
    sort,
    cartDiscount,
    limit: 20,
    offset: 0,
  })

  const title = cartDiscount
    ? `Sepette %${cartDiscount} İndirimli Ürünler`
    : 'Tüm Ürünler'

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1">
        <Link href="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
        <span className="mx-1">/</span>
        {cartDiscount ? (
          <>
            <Link href="/urunler" className="hover:text-foreground transition-colors">Tüm Ürünler</Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Sepette %{cartDiscount} İndirim</span>
          </>
        ) : (
          <span className="text-foreground font-medium">Tüm Ürünler</span>
        )}
      </nav>

      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <ProductGrid
        initialProducts={page.data}
        totalCount={page.total}
        initialFilters={{
          q,
          category: categorySlug,
          min: params.min ?? '',
          max: params.max ?? '',
          sort: sort ?? 'newest',
        }}
        filterCategories={categories}
        basePath="/urunler"
      />
    </div>
  )
}