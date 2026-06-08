import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Category } from '@/types'

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

export default async function CategorySection() {
  const categories = await getCategories()

  if (categories.length === 0) return null

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
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground leading-tight">{cat.name}</p>
              {cat.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
