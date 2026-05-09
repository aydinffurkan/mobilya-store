import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'
import { Product } from '@/types'

const categoryNames: Record<string, string> = {
  'yatak-odasi': 'Yatak Odası',
  'yemek-odasi': 'Yemek Odası',
  'koltuk-oturma': 'Koltuk & Oturma',
  'genc-odasi': 'Genç Odası',
  'tv-unitesi': 'TV Ünitesi',
  'bahce-mobilyasi': 'Bahçe Mobilyası',
  'dekorasyon': 'Dekorasyon',
}

async function getCategoryProducts(slug: string): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!cat) return []

    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('category_id', cat.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as Product[]
  } catch {
    return []
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const products = await getCategoryProducts(slug)
  const categoryName = categoryNames[slug] ?? slug

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-foreground">Ana Sayfa</a>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{categoryName}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{categoryName}</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} ürün</p>
        </div>
        <select className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none">
          <option>Önerilen</option>
          <option>Fiyat: Düşük → Yüksek</option>
          <option>Fiyat: Yüksek → Düşük</option>
        </select>
      </div>

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
