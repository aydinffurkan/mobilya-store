import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/products/ProductCard'
import { Product } from '@/types'

// Mock data for when Supabase is not yet configured
const mockProducts: Product[] = [
  {
    id: '1', name: 'Modern Yatak Odası Takımı', slug: 'modern-yatak-odasi', price: 24999, sale_price: 19999,
    category_id: '1', category: { id: '1', name: 'Yatak Odası', slug: 'yatak-odasi', description: null, image_url: null, parent_id: null, created_at: '' },
    images: [], stock: 5, is_featured: true, is_active: true, description: null, created_at: '', updated_at: '',
  },
  {
    id: '2', name: 'Klasik Yemek Masası Seti', slug: 'klasik-yemek-masasi', price: 12999, sale_price: null,
    category_id: '2', category: { id: '2', name: 'Yemek Odası', slug: 'yemek-odasi', description: null, image_url: null, parent_id: null, created_at: '' },
    images: [], stock: 8, is_featured: true, is_active: true, description: null, created_at: '', updated_at: '',
  },
  {
    id: '3', name: 'Lüks Köşe Koltuk Takımı', slug: 'luks-kose-koltuk', price: 18500, sale_price: 15500,
    category_id: '3', category: { id: '3', name: 'Koltuk & Oturma', slug: 'koltuk-oturma', description: null, image_url: null, parent_id: null, created_at: '' },
    images: [], stock: 3, is_featured: true, is_active: true, description: null, created_at: '', updated_at: '',
  },
  {
    id: '4', name: 'İskandinav Genç Odası', slug: 'iskandinavgenc-odasi', price: 8999, sale_price: null,
    category_id: '4', category: { id: '4', name: 'Genç Odası', slug: 'genc-odasi', description: null, image_url: null, parent_id: null, created_at: '' },
    images: [], stock: 10, is_featured: true, is_active: true, description: null, created_at: '', updated_at: '',
  },
]

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(8)
      .order('created_at', { ascending: false })

    if (error || !data) return mockProducts
    return data as Product[]
  } catch {
    return mockProducts
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  return (
    <section className="bg-secondary/40 py-14">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Öne Çıkan Ürünler</h2>
            <p className="text-muted-foreground mt-1 text-sm">Sizin için seçtiklerimiz</p>
          </div>
          <Link href="/urunler" className="text-sm font-medium text-[#8B6914] hover:underline hidden md:block">
            Tüm Ürünler →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/urunler" className="text-sm font-medium text-[#8B6914] hover:underline">
            Tüm ürünleri gör →
          </Link>
        </div>
      </div>
    </section>
  )
}
