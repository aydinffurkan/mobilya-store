import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Product } from '@/types'
import { Plus } from 'lucide-react'
import ProductsTable from '@/components/admin/ProductsTable'

async function getProducts(): Promise<Product[]> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('products')
      .select('*, category:categories(name)')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data as Product[]
  } catch {
    return []
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ürünler</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} ürün</p>
        </div>
        <Link href="/admin/urunler/yeni" className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#8B6914] hover:bg-[#7a5c12] text-white text-sm font-medium transition-colors">
          <Plus size={16} className="mr-1" /> Yeni Ürün
        </Link>
      </div>

      <ProductsTable products={products} />
    </div>
  )
}
