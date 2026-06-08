import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Product } from '@/types'
import ProductPurchasePanel from '@/components/products/ProductPurchasePanel'
import ProductImageGallery from '@/components/products/ProductImageGallery'
import ProductViewTracker from '@/components/products/ProductViewTracker'
import { Separator } from '@/components/ui/separator'
import { Truck, Shield, Wrench, RotateCcw } from 'lucide-react'

const mockProducts: Record<string, Product> = {
  'modern-yatak-odasi': { id: '1', name: 'Modern Yatak Odası Takımı', slug: 'modern-yatak-odasi', price: 24999, sale_price: 19999, category_id: '1', category: { id: '1', name: 'Yatak Odası', slug: 'yatak-odasi', description: null, image_url: null, parent_id: null, created_at: '' }, images: [], stock: 5, is_featured: true, is_active: true, description: 'Modern çizgilerle tasarlanmış, kaliteli malzemeden üretilmiş yatak odası takımı. Başlık, yatak baza, 2 komodin ve şifonyer dahildir.', created_at: '', updated_at: '' },
  'klasik-yemek-masasi': { id: '2', name: 'Klasik Yemek Masası Seti', slug: 'klasik-yemek-masasi', price: 12999, sale_price: null, category_id: '2', category: { id: '2', name: 'Yemek Odası', slug: 'yemek-odasi', description: null, image_url: null, parent_id: null, created_at: '' }, images: [], stock: 8, is_featured: true, is_active: true, description: '6 sandalyeli klasik yemek masası takımı. Masif ahşap gövde, uzun ömürlü ve şık tasarım.', created_at: '', updated_at: '' },
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*), variants:product_variants(*), components:product_components(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (error || !data) return mockProducts[slug] ?? null
    return data as Product
  } catch {
    return mockProducts[slug] ?? null
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-foreground">Ana Sayfa</a>
        <span className="mx-2">/</span>
        <a href="/urunler" className="hover:text-foreground">Ürünler</a>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      <ProductViewTracker productId={product.id} />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="relative">
          <ProductImageGallery images={product.images ?? []} name={product.name} />
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">{product.category?.name}</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{product.name}</h1>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <Separator />

          <ProductPurchasePanel product={product} />

          <Separator />

          {/* Services */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Truck, label: 'Ücretsiz Nakliye', sub: 'Tüm Türkiye' },
              { icon: Wrench, label: 'Ücretsiz Kurulum', sub: 'Uzman ekip' },
              { icon: Shield, label: '2 Yıl Garanti', sub: 'Fabrika garantisi' },
              { icon: RotateCcw, label: '30 Gün İade', sub: 'Koşulsuz iade' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl bg-secondary/60">
                <Icon size={16} className="text-[#8B6914] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
