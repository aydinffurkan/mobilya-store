import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductGrid from '@/components/products/ProductGrid'
import { getCategoryBySlug, getCategoryById, getSubcategories } from '@/lib/repositories/categories'
import { getProductsPage } from '@/lib/repositories/products'
import type { ProductFilters } from '@/lib/repositories/products'

interface SearchParams {
  sort?: string
  q?: string
  min?: string
  max?: string
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}) {
  const { slug } = await params
  const sp = await searchParams
  const sort = (sp.sort ?? 'newest') as ProductFilters['sort']

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const [parent, subcategories] = await Promise.all([
    category.parent_id ? getCategoryById(category.parent_id) : Promise.resolve(null),
    getSubcategories(category.id),
  ])

  const categoryIds = [category.id, ...subcategories.map((s) => s.id)]

  const page = await getProductsPage({
    categoryIds,
    q: sp.q?.trim() || undefined,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    sort,
    limit: 20,
    offset: 0,
  })

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1">
        <Link href="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
        {parent && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/kategori/${parent.slug}`} className="hover:text-foreground">
              {parent.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{page.total} ürün</p>
      </div>

      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/kategori/${sub.slug}`}
              className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-sm hover:bg-[#C8B8A6] hover:border-[#C8B8A6] hover:text-[#222222] transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <ProductGrid
        initialProducts={page.data}
        totalCount={page.total}
        initialFilters={{
          q: sp.q ?? '',
          category: '',
          min: sp.min ?? '',
          max: sp.max ?? '',
          sort: sort ?? 'newest',
        }}
        lockedCategory={slug}
        basePath={`/kategori/${slug}`}
      />
    </div>
  )
}