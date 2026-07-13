import { createAdminClient } from '@/lib/supabase/admin'
import { Supplier } from '@/types'
import SupplierManager from '@/components/admin/SupplierManager'

async function getData(): Promise<{ suppliers: Supplier[]; productCounts: Record<string, number> }> {
  try {
    const adminClient = createAdminClient()
    const [{ data: suppliers }, { data: products }] = await Promise.all([
      adminClient.from('suppliers').select('*').order('name'),
      adminClient.from('products').select('supplier_id').not('supplier_id', 'is', null),
    ])

    const productCounts: Record<string, number> = {}
    for (const p of (products ?? []) as { supplier_id: string }[]) {
      productCounts[p.supplier_id] = (productCounts[p.supplier_id] ?? 0) + 1
    }

    return { suppliers: (suppliers as Supplier[]) ?? [], productCounts }
  } catch {
    return { suppliers: [], productCounts: {} }
  }
}

export default async function SuppliersPage() {
  const { suppliers, productCounts } = await getData()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tedarikçiler</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ürünlere atanan tedarikçiler. Yalnızca admin panelinde görünür, müşterilere gösterilmez.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <SupplierManager suppliers={suppliers} productCounts={productCounts} />

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 space-y-1.5">
          <p className="font-semibold">Veritabanı kurulumu gerekli</p>
          <p>Bu sayfayı kullanmak için Supabase SQL editöründe aşağıdaki sorguyu çalıştırın:</p>
          <pre className="mt-2 bg-amber-100 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS supplier_id UUID
  REFERENCES suppliers(id) ON DELETE SET NULL;`}</pre>
        </div>
      </div>
    </div>
  )
}
