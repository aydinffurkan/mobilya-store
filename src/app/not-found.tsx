import Link from 'next/link'
import { Armchair, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Category } from '@/types'

async function getMainCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .is('parent_id', null)
      .order('name')
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

export default async function NotFound() {
  const categories = await getMainCategories()

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Arka plan büyük 404 yazısı */}
      <span
        aria-hidden="true"
        className="absolute select-none font-black text-[clamp(160px,30vw,380px)] text-[#C8B8A6]/20 leading-none tracking-tighter pointer-events-none"
      >
        404
      </span>

      {/* İçerik */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">

        {/* İkon */}
        <div className="w-20 h-20 rounded-2xl bg-white border border-[#E9E7E2] shadow-sm flex items-center justify-center mb-8">
          <Armchair className="w-9 h-9 text-[#C8B8A6] stroke-[1.25]" />
        </div>

        {/* Başlık */}
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#C8B8A6] mb-3">
          Sayfa Bulunamadı
        </p>
        <h1 className="text-3xl md:text-4xl font-light tracking-widest uppercase text-[#222222] leading-tight mb-4">
          Bu köşe boş
        </h1>
        <p className="text-sm font-light text-[#777777] leading-relaxed mb-8">
          Aradığınız sayfa taşınmış, kaldırılmış ya da hiç var olmamış olabilir.
          Aşağıdaki kategorilerden birini keşfedebilirsiniz.
        </p>

        {/* Kategori butonları */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                className="h-9 px-4 rounded-full border border-[#E9E7E2] bg-white text-[#222222] text-xs font-medium tracking-wide hover:border-[#222222]/40 hover:bg-[#222222] hover:text-white transition-all duration-150"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Ana sayfa butonu */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-xl bg-[#222222] text-white text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={15} strokeWidth={1.8} />
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Alt dekorasyon çizgisi */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C8B8A6]/40 to-transparent" />
    </div>
  )
}
