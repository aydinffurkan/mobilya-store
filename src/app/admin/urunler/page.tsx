import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Product, Supplier } from '@/types'
import { Plus, LayoutList } from 'lucide-react'
import ProductsTable from '@/components/admin/ProductsTable'

async function getData(): Promise<{ products: Product[]; suppliers: Supplier[] }> {
  try {
    const adminClient = createAdminClient()
    const [{ data: products }, { data: suppliers }] = await Promise.all([
      adminClient
        .from('products')
        .select('*, category:categories(name)')
        .order('created_at', { ascending: false }),
      adminClient.from('suppliers').select('id, name').order('name'),
    ])
    return {
      products: (products as Product[]) ?? [],
      suppliers: (suppliers as Supplier[]) ?? [],
    }
  } catch {
    return { products: [], suppliers: [] }
  }
}

export default async function AdminProductsPage() {
  const { products, suppliers } = await getData()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ürünler</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} ürün</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/urunler/toplu-ekle" className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors">
            <LayoutList size={14} className="mr-1.5" /> Toplu Ekle
          </Link>
          <Link href="/admin/urunler/yeni" className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white text-sm font-medium transition-colors">
            <Plus size={16} className="mr-1" /> Yeni Ürün
          </Link>
        </div>
      </div>

      <ProductsTable products={products} suppliers={suppliers} />
    </div>
  )
}
