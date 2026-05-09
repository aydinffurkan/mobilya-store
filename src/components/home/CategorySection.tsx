import Link from 'next/link'

const categories = [
  { name: 'Yatak Odası', slug: 'yatak-odasi', emoji: '🛏️', count: '120+ ürün' },
  { name: 'Yemek Odası', slug: 'yemek-odasi', emoji: '🍽️', count: '80+ ürün' },
  { name: 'Koltuk & Oturma', slug: 'koltuk-oturma', emoji: '🛋️', count: '95+ ürün' },
  { name: 'Genç Odası', slug: 'genc-odasi', emoji: '📚', count: '60+ ürün' },
  { name: 'TV Ünitesi', slug: 'tv-unitesi', emoji: '📺', count: '40+ ürün' },
  { name: 'Bahçe Mobilyası', slug: 'bahce-mobilyasi', emoji: '🌿', count: '35+ ürün' },
]

export default function CategorySection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Kategoriler</h2>
          <p className="text-muted-foreground mt-1 text-sm">İhtiyacınız olan mobilyayı bulun</p>
        </div>
        <Link href="/urunler" className="text-sm font-medium text-[#8B6914] hover:underline hidden md:block">
          Tümünü Gör →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/kategori/${cat.slug}`}
            className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card hover:border-[#8B6914]/40 hover:bg-secondary transition-all duration-200 hover:shadow-md"
          >
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{cat.emoji}</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground leading-tight">{cat.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.count}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
