import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TopBarTicker from '@/components/layout/TopBarTicker'

export interface TopBarLink {
  label: string
  href: string
}

export interface TopBarData {
  enabled: boolean
  texts: string[]
  interval: number
  links: TopBarLink[]
  bg_color: string
  text_color: string
}

const DEFAULT: TopBarData = {
  enabled: true,
  texts: ['Fırsatları Kaçırmayın!', 'Ücretsiz Kargo — 5.000₺ ve Üzeri Siparişlerde'],
  interval: 4,
  links: [
    { label: 'Blog',          href: '/blog' },
    { label: 'İletişim',      href: '/iletisim' },
    { label: 'Sipariş Takip', href: '/hesabim' },
  ],
  bg_color: '#1e293b',
  text_color: '#ffffff',
}

async function getTopBarData(): Promise<TopBarData> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'top_bar')
      .single()
    if (!data?.value) return DEFAULT
    const val = data.value as Partial<TopBarData> & { text?: string }
    // Geriye dönük uyumluluk: eski 'text' string alanını 'texts' dizisine çevir
    const texts = val.texts?.length ? val.texts : (val.text ? [val.text] : DEFAULT.texts)
    return { ...DEFAULT, ...val, texts }
  } catch {
    return DEFAULT
  }
}

export default async function TopBar() {
  const bar = await getTopBarData()
  if (!bar.enabled) return null

  const validTexts = bar.texts.filter(Boolean)
  if (validTexts.length === 0) return null

  return (
    <div style={{ backgroundColor: bar.bg_color }} className="w-full text-xs">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9 gap-6">

        {/* Sol — dönen duyurular */}
        <TopBarTicker
          texts={validTexts}
          interval={bar.interval ?? 4}
          textColor={bar.text_color}
        />

        {/* Sağ — linkler */}
        {bar.links.length > 0 && (
          <nav className="flex items-center flex-shrink-0">
            {bar.links.map((link, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && (
                  <span className="hidden sm:inline mx-3 opacity-20" style={{ color: bar.text_color }}>|</span>
                )}
                <Link
                  href={link.href}
                  style={{ color: bar.text_color }}
                  className="opacity-75 hover:opacity-100 transition-opacity whitespace-nowrap text-xs hidden sm:inline-block"
                >
                  {link.label}
                </Link>
              </span>
            ))}
            {/* Mobilde sadece ilk link */}
            <Link
              href={bar.links[0].href}
              style={{ color: bar.text_color }}
              className="opacity-75 hover:opacity-100 transition-opacity sm:hidden text-xs"
            >
              {bar.links[0].label}
            </Link>
          </nav>
        )}

      </div>
    </div>
  )
}
