interface TopProduct {
  id: string
  name: string
  quantity: number
  revenue: number
}

export default function TopProductsChart({ products }: { products: TopProduct[] }) {
  const max = Math.max(1, ...products.map((p) => p.quantity))

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <h2 className="font-bold mb-1">En Çok Satan Ürünler</h2>
      <p className="text-xs text-muted-foreground mb-5">Satış adedine göre</p>

      {products.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">Henüz satış verisi yok.</p>
      ) : (
        <div className="space-y-3.5">
          {products.map((p, i) => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium truncate flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {p.quantity} adet · <span className="font-semibold text-[#222222]">{p.revenue.toLocaleString('tr-TR')} ₺</span>
                </p>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#222222] rounded-full"
                  style={{ width: `${Math.max(4, (p.quantity / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
