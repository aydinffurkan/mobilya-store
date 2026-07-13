import { createAdminClient } from '@/lib/supabase/admin'
import { Category } from '@/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BulkProductForm from '@/components/admin/BulkProductForm'

async function getCategories(): Promise<Category[]> {
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient.from('categories').select('*').order('name')
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

export default async function BulkProductPage() {
  const categories = await getCategories()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/urunler"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft size={14} /> Ürünlere Dön
        </Link>
        <h1 className="text-2xl font-bold">Toplu Ürün Ekle</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Birden fazla ürünü aynı anda ekleyin. Görseller, varyantlar ve detaylar eklendikten sonra her ürün için ayrı ayrı düzenlenebilir.
        </p>
      </div>
      <BulkProductForm categories={categories} />
    </div>
  )
}
