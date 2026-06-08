import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'
import { Category, Product } from '@/types'

interface CategoryData {
  category: Category
  parent: Category | null
  subcategories: Category[]
  products: Product[]
}

async function getCategoryData(slug: string): Promise<CategoryData | null> {
  try {
    const supabase = await createClient()
    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!category) return null

    const [{ data: parent }, { data: subcategories }] = await Promise.all([
      category.parent_id
        ? supabase.from('categories').select('*').eq('id', category.parent_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('categories').select('*').eq('parent_id', category.id).order('name'),
    ])

    // Üst kategoride alt kategorilerin ürünleri de gösterilir; alt kategoride yalnızca kendi ürünleri
    const categoryIds = [category.id, ...(subcategories ?? []).map((s) => s.id)]

    const { data: products } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .in('category_id', categoryIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return {
      category: category as Category,
      parent: (parent as Category) ?? null,
      subcategories: (subcategories as Category[]) ?? [],
      products: (products as Product[]) ?? [],
    }
  } catch {
    return null
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getCategoryData(slug)

  if (!data) notFound()

  const { category, parent, subcategories, products } = data

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Ana Sayfa</Link>
        {parent && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/kategori/${parent.slug}`} className="hover:text-foreground">{parent.name}</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} ürün</p>
        </div>
        <select className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none">
          <option>Önerilen</option>
          <option>Fiyat: Düşük → Yüksek</option>
          <option>Fiyat: Yüksek → Düşük</option>
        </select>
      </div>

      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/kategori/${sub.slug}`}
              className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-sm hover:border-[#8B6914] hover:text-[#8B6914] transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-lg font-medium">Bu kategoride henüz ürün yok</p>
          <p className="text-sm mt-1">Yakında eklenecek</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
