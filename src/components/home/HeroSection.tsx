import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

async function getHero() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'hero').single()
    return data?.value ?? {}
  } catch { return {} }
}

const defaults = {
  title: 'Ulaşılabilir Lüks',
  subtitle: 'Yatak Odası Koleksiyonları',
  desc: 'Modern ve klasik çizgilerin buluştuğu özel tasarım mobilyalar. Ücretsiz nakliye ve kurulum.',
  cta_text: 'Koleksiyonu Gör',
  cta_href: '/kategori/yatak-odasi',
  badge_1: 'Ücretsiz Nakliye',
  badge_2: 'Ücretsiz Kurulum',
  badge_3: '2 Yıl Garanti',
}

export default async function HeroSection() {
  const hero = { ...defaults, ...(await getHero()) }

  return (
    <section className="relative">
      <div className="bg-gradient-to-r from-amber-950 to-amber-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest">{hero.subtitle}</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">{hero.title}</h1>
            <p className="text-gray-300 text-lg max-w-md leading-relaxed">{hero.desc}</p>
            <div className="flex gap-3 flex-wrap">
              <Link href={hero.cta_href} className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[#c9a84c] hover:bg-[#b8962f] text-white font-semibold text-sm transition-colors">
                {hero.cta_text} <ArrowRight size={16} className="ml-2" />
              </Link>
              <Link href="/urunler" className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-white text-white hover:bg-white/10 font-semibold text-sm transition-colors">
                Tüm Ürünler
              </Link>
            </div>
            <div className="flex gap-6 pt-4 text-sm text-gray-400 flex-wrap">
              {[hero.badge_1, hero.badge_2, hero.badge_3].filter(Boolean).map(b => (
                <span key={b} className="flex items-center gap-1.5">✓ {b}</span>
              ))}
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="w-80 h-64 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-white/40 text-lg border border-white/20">
              Hero Görseli
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
