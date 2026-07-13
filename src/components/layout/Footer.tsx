import Link from 'next/link'
import Image from 'next/image'
import { Truck, Wrench, ShieldCheck, Lock, Phone, Mail, MapPin, ChevronRight } from 'lucide-react'
import NewsletterForm from '@/components/layout/NewsletterForm'
import { createClient } from '@/lib/supabase/server'

const SERVICES = [
  { icon: Truck,       title: 'Ücretsiz Nakliye', desc: 'Tüm Türkiye'      },
  { icon: Wrench,      title: 'Ücretsiz Kurulum', desc: 'Tüm ürünlerde'    },
  { icon: ShieldCheck, title: '2 Yıl Garanti',    desc: 'Tüm mobilyalarda' },
  { icon: Lock,        title: 'Güvenli Ödeme',    desc: '256-bit SSL'      },
]

const LINKS: [string, string][] = [
  ['Ödeme Seçenekleri',     '/odeme-secenekleri'  ],
  ['Garanti Koşulları',     '/garanti'            ],
  ['İade & Değişim',        '/iade'               ],
  ['Kargo Takibi',          '/kargo'              ],
  ['Sıkça Sorulan Sorular', '/sss'                ],
  ['İletişim',              '/iletisim'           ],
]

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="3" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="1" y="5" width="22" height="14" rx="4" />
      <polygon fill="currentColor" stroke="none" points="10 9 15 12 10 15" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  )
}

interface SocialLink { href: string; title: string; Icon: () => React.ReactElement }

export default async function Footer() {
  type LogoData    = { image_url?: string; alt?: string }
  type ContactData = { phone?: string; email?: string; address?: string }
  type SocialData  = { facebook?: string; instagram?: string; youtube?: string; tiktok?: string }
  type CatRow      = { id: string; name: string; slug: string }

  let logo:       LogoData    | null = null
  let contact:    ContactData | null = null
  let categories: CatRow[]          = []
  let social:     SocialData  | null = null

  try {
    const supabase = await createClient()
    const [logoRes, contactRes, catRes, socialRes] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'logo').single(),
      supabase.from('site_settings').select('value').eq('key', 'contact').single(),
      supabase.from('categories').select('id, name, slug, parent_id').is('parent_id', null).order('name'),
      supabase.from('site_settings').select('value').eq('key', 'social_links').single(),
    ])
    logo       = (logoRes.data?.value    as LogoData)    ?? null
    contact    = (contactRes.data?.value as ContactData) ?? null
    categories = (catRes.data            as CatRow[])    ?? []
    social     = (socialRes.data?.value  as SocialData)  ?? null
  } catch {}

  const phone   = contact?.phone   || '444 21 05'
  const email   = contact?.email   || 'info@mobilyastore.com'
  const address = contact?.address || 'İstanbul, Türkiye'

  const socialLinks: SocialLink[] = [
    { key: 'instagram', Icon: InstagramIcon, title: 'Instagram' },
    { key: 'facebook',  Icon: FacebookIcon,  title: 'Facebook'  },
    { key: 'youtube',   Icon: YoutubeIcon,   title: 'YouTube'   },
    { key: 'tiktok',    Icon: TikTokIcon,    title: 'TikTok'    },
  ]
    .filter(({ key }) => social?.[key as keyof typeof social])
    .map(({ key, Icon, title }) => ({
      href: social![key as keyof typeof social]!,
      title,
      Icon,
    }))

  return (
    <footer className="bg-white border-t border-neutral-200">

      {/* Gold accent line */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

      {/* Services strip */}
      <div className="bg-[#FAF8F4] border-b border-neutral-100">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-7 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#222222]/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[#222222]" />
              </div>
              <div>
                <p className="text-neutral-800 font-semibold text-sm">{title}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bülten kaydı */}
      <div className="border-b border-neutral-100">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h3 className="text-neutral-800 font-semibold text-sm">Bültenimize Katılın</h3>
            <p className="text-xs text-neutral-400 mt-1">Yeni ürünler ve özel kampanyalardan ilk siz haberdar olun.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <Link href="/" className="inline-block">
            {logo?.image_url ? (
              <div className="relative h-8 w-36">
                <Image
                  src={logo.image_url}
                  alt={logo.alt || 'Logo'}
                  fill
                  className="object-contain object-left"
                  sizes="144px"
                />
              </div>
            ) : (
              <span className="text-xl font-bold text-[#222222] tracking-wide">MOBİLYASTORE</span>
            )}
          </Link>
          <p className="text-sm leading-relaxed mt-4 text-neutral-500">
            Ulaşılabilir lüks anlayışıyla tasarlanmış özel mobilya koleksiyonları. Evinize değer katıyoruz.
          </p>

          {/* Social */}
          {socialLinks.length > 0 && (
            <div className="flex gap-2 mt-6">
              {socialLinks.map(({ href, title, Icon }) => (
                <a
                  key={title}
                  href={href}
                  title={title}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-500 flex items-center justify-center hover:bg-[#222222]/10 hover:text-[#222222] hover:border-[#222222]/30 transition-all"
                >
                  <Icon />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-neutral-800 font-semibold text-xs uppercase tracking-widest mb-5">Kategoriler</h3>
          <ul className="space-y-3">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/kategori/${cat.slug}`}
                  className="text-sm text-neutral-500 hover:text-[#222222] transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight size={12} className="opacity-0 -ml-3.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer service */}
        <div>
          <h3 className="text-neutral-800 font-semibold text-xs uppercase tracking-widest mb-5">Müşteri Hizmetleri</h3>
          <ul className="space-y-3">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-neutral-500 hover:text-[#222222] transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight size={12} className="opacity-0 -ml-3.5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-neutral-800 font-semibold text-xs uppercase tracking-widest mb-5">İletişim</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#222222]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone size={14} className="text-[#222222]" />
              </div>
              <div>
                <p className="text-sm text-neutral-800 font-medium">{phone}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Haftaiçi 09:00–18:00</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#222222]/10 flex items-center justify-center flex-shrink-0">
                <Mail size={14} className="text-[#222222]" />
              </div>
              <span className="text-sm text-neutral-600">{email}</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#222222]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={14} className="text-[#222222]" />
              </div>
              <span className="text-sm text-neutral-500 leading-relaxed">{address}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-100 bg-[#FAF8F4]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <span>© {new Date().getFullYear()} MobilyaStore. Tüm hakları saklıdır.</span>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            {([
              ['Gizlilik Politikası', '/gizlilik'          ],
              ['Kullanım Koşulları',  '/kullanim-kosullari' ],
              ['KVKK',               '/kvkk'               ],
              ['Çerez Politikası',   '/cerez-politikasi'   ],
            ] as const).map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-[#222222] transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}
