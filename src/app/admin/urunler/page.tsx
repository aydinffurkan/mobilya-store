import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil } from 'lucide-react'
import DeleteProductButton from '@/components/admin/DeleteProductButton'

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
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

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Henüz ürün eklenmedi.</p>
            <Link href="/admin/urunler/yeni" className="text-[#8B6914] hover:underline text-sm mt-2 block">
              İlk ürünü ekle →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Ürün Adı</th>
                <th className="text-left px-4 py-3 font-medium">Kategori</th>
                <th className="text-left px-4 py-3 font-medium">Fiyat</th>
                <th className="text-left px-4 py-3 font-medium">Stok</th>
                <th className="text-left px-4 py-3 font-medium">Durum</th>
                <th className="text-right px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-[#8B6914]">{p.price.toLocaleString('tr-TR')} ₺</p>
                      {p.sale_price && (
                        <p className="text-xs text-muted-foreground line-through">{p.sale_price.toLocaleString('tr-TR')} ₺</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.is_active ? 'default' : 'secondary'} className={p.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                      {p.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/urunler/${p.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <DeleteProductButton productId={p.id} productName={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
