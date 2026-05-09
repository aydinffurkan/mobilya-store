import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'
import { Product } from '@/types'
import { Filter } from 'lucide-react'

const mockProducts: Product[] = [
  { id: '1', name: 'Modern Yatak Odası Takımı', slug: 'modern-yatak-odasi', price: 24999, sale_price: 19999, category_id: '1', category: { id: '1', name: 'Yatak Odası', slug: 'yatak-odasi', description: null, image_url: null, parent_id: null, created_at: '' }, images: [], stock: 5, is_featured: true, is_active: true, description: 'Modern çizgilerle tasarlanmış takım', created_at: '', updated_at: '' },
  { id: '2', name: 'Klasik Yemek Masası Seti', slug: 'klasik-yemek-masasi', price: 12999, sale_price: null, category_id: '2', category: { id: '2', name: 'Yemek Odası', slug: 'yemek-odasi', description: null, image_url: null, parent_id: null, created_at: '' }, images: [], stock: 8, is_featured: true, is_active: true, description: null, created_at: '', updated_at: '' },
  { id: '3', name: 'Lüks Köşe Koltuk Takımı', slug: 'luks-kose-koltuk', price: 18500, sale_price: 15500, category_id: '3', category: { id: '3', name: 'Koltuk & Oturma', slug: 'koltuk-oturma', description: null, image_url: null, parent_id: null, created_at: '' }, images: [], stock: 3, is_featured: true, is_active: true, description: null, created_at: '', updated_at: '' },
  { id: '4', name: 'İskandinav Genç Odası', slug: 'iskandinavgenc-odasi', price: 8999, sale_price: null, category_id: '4', category: { id: '4', name: 'Genç Odası', slug: 'genc-odasi', description: null, image_url: null, parent_id: null, created_at: '' }, images: [], stock: 10, is_featured: false, is_active: true, description: null, created_at: '', updated_at: '' },
  { id: '5', name: 'Ahşap TV Ünitesi', slug: 'ahsap-tv-unitesi', price: 5499, sale_price: 4299, category_id: '5', category: { id: '5', name: 'TV Ünitesi', slug: 'tv-unitesi', description: null, image_url: null, parent_id: null, created_at: '' }, images: [], stock: 15, is_featured: false, is_active: true, description: null, created_at: '', updated_at: '' },
  { id: '6', name: 'Bahçe Koltuk Seti', slug: 'bahce-koltuk-seti', price: 9800, sale_price: null, category_id: '6', category: { id: '6', name: 'Bahçe Mobilyası', slug: 'bahce-mobilyasi', description: null, image_url: null, parent_id: null, created_at: '' }, images: [], stock: 7, is_featured: false, is_active: true, description: null, created_at: '', updated_at: '' },
]

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error || !data) return mockProducts
    return data as Product[]
  } catch {
    return mockProducts
  }
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <span>Ana Sayfa</span> <span className="mx-2">/</span> <span className="text-foreground font-medium">Tüm Ürünler</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tüm Ürünler</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} ürün listeleniyor</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors">
            <Filter size={14} /> Filtrele
          </button>
          <select className="px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40">
            <option>Sıralama: Önerilen</option>
            <option>Fiyat: Düşükten Yükseğe</option>
            <option>Fiyat: Yüksekten Düşüğe</option>
            <option>En Yeniler</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
