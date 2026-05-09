import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Product } from '@/types'
import AddToCartButton from '@/components/products/AddToCartButton'
import { Badge } from '@/components/ui/badge'
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
      .select('*, category:categories(*)')
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

  const discountPercent = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : null

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

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center text-muted-foreground relative overflow-hidden">
            {product.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-2">🛋️</div>
                <p className="text-sm">Görsel yakında eklenecek</p>
              </div>
            )}
            {discountPercent && (
              <Badge className="absolute top-3 left-3 bg-red-500 text-white">-%{discountPercent}</Badge>
            )}
          </div>
          {/* Thumbnail row */}
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg border-2 border-transparent hover:border-[#8B6914] cursor-pointer transition-colors" />
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-muted-foreground">{product.category?.name}</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{product.name}</h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[#8B6914]">
              {(product.sale_price ?? product.price).toLocaleString('tr-TR')} ₺
            </span>
            {product.sale_price && (
              <span className="text-lg text-muted-foreground line-through">
                {product.price.toLocaleString('tr-TR')} ₺
              </span>
            )}
          </div>

          <Separator />

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{product.stock > 0 ? `Stokta var (${product.stock} adet)` : 'Stokta yok'}</span>
          </div>

          <AddToCartButton product={product} />

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
