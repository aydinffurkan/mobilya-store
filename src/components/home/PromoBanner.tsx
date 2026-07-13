import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export interface PromoBannerData {
  enabled: boolean
  image_url: string | null
  mobile_image_url: string | null
  href: string
  alt: string
}

export async function getPromoBanner(slot: string): Promise<PromoBannerData> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', `promo_banner_${slot}`)
      .single()
    if (!data?.value) return { enabled: false, image_url: null, mobile_image_url: null, href: '/', alt: '' }
    return data.value as PromoBannerData
  } catch {
    return { enabled: false, image_url: null, mobile_image_url: null, href: '/', alt: '' }
  }
}

interface Props {
  slot: string
}

export default async function PromoBanner({ slot }: Props) {
  const banner = await getPromoBanner(slot)
  if (!banner.enabled || !banner.image_url) return null

  return (
    <Link href={banner.href} className="block w-full group">
      {banner.mobile_image_url ? (
        <>
          {/* Mobil — ayrı görsel */}
          <div className="sm:hidden relative w-full" style={{ aspectRatio: '3/1' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.mobile_image_url}
              alt={banner.alt || 'Kampanya'}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:opacity-95 transition-opacity"
            />
          </div>
          {/* Masaüstü — ayrı görsel, sabit oran */}
          <div className="hidden sm:block relative w-full" style={{ aspectRatio: '1440/200' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image_url}
              alt={banner.alt || 'Kampanya'}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:opacity-95 transition-opacity"
            />
          </div>
        </>
      ) : (
        <>
          {/* Mobil — masaüstü görseli 3:1 oranla kırpılır */}
          <div className="sm:hidden relative w-full" style={{ aspectRatio: '3/1' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image_url}
              alt={banner.alt || 'Kampanya'}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:opacity-95 transition-opacity"
            />
          </div>
          {/* Masaüstü — sabit 1440×200 oranı, tam genişlik */}
          <div className="hidden sm:block relative w-full" style={{ aspectRatio: '1440/200' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.image_url}
              alt={banner.alt || 'Kampanya'}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:opacity-95 transition-opacity"
            />
          </div>
        </>
      )}
    </Link>
  )
}
