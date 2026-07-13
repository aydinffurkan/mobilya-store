'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Heart, X, ChevronDown, LayoutDashboard, Menu, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import SearchBar from '@/components/layout/SearchBar'

/* ─── Types ─────────────────────────────────────────────────────────── */
export interface MegaMenuCategory {
  name: string
  slug: string
  sub: { name: string; slug: string }[]
  promoCards?: { title: string; image_url?: string | null; href?: string | null }[]
}

interface Props {
  categories?: MegaMenuCategory[]
  logoUrl?: string | null
  logoAlt?: string
}

/* ─── Demo Data ──────────────────────────────────────────────────────── */
const DEMO_CATEGORIES: MegaMenuCategory[] = [
  {
    name: 'Yatak Odası', slug: 'yatak-odasi',
    sub: [
      { name: 'Modern Yatak Odası',       slug: 'modern-yatak-odasi' },
      { name: 'Luxury Yatak Odası',        slug: 'luxury-yatak-odasi' },
      { name: 'Ahşap Yatak Odası',         slug: 'ahsap-yatak-odasi' },
      { name: 'İskandinav Yatak Odası',    slug: 'iskandinav-yatak-odasi' },
      { name: 'Klasik Yatak Odası',        slug: 'klasik-yatak-odasi' },
      { name: 'Art Deco Yatak Odası',      slug: 'art-deco-yatak-odasi' },
      { name: 'Genç Yatak Odası',          slug: 'genc-yatak-odasi' },
      { name: 'İndirimli Yatak Odası',     slug: 'indirimli-yatak-odasi' },
      { name: 'Outlet Yatak Odası',        slug: 'outlet-yatak-odasi' },
      { name: '2025 Yeni Sezon',           slug: '2025-yatak-odasi' },
    ],
    promoCards: [
      { title: 'Modern Yatak Odaları',  image_url: null, href: '/kategori/modern-yatak-odasi' },
      { title: 'Luxury Yatak Odaları',  image_url: null, href: '/kategori/luxury-yatak-odasi' },
    ],
  },
  {
    name: 'Yemek Odası', slug: 'yemek-odasi',
    sub: [
      { name: 'Modern Yemek Odası',        slug: 'modern-yemek-odasi' },
      { name: 'Luxury Yemek Odası',         slug: 'luxury-yemek-odasi' },
      { name: 'Ahşap Yemek Odası',          slug: 'ahsap-yemek-odasi' },
      { name: 'İskandinav Yemek Odası',     slug: 'iskandinav-yemek-odasi' },
      { name: 'Klasik Yemek Odası',         slug: 'klasik-yemek-odasi' },
      { name: 'Mutfak Köşe Takımı',         slug: 'mutfak-kose-takimi' },
      { name: 'Mutfak Masa Takımı',         slug: 'mutfak-masa-takimi' },
      { name: 'Yemek Masası Takımı',        slug: 'yemek-masasi-takimi' },
      { name: 'İndirimli Yemek Odası',      slug: 'indirimli-yemek-odasi' },
      { name: 'Sandalye Modelleri',         slug: 'sandalye-modelleri' },
    ],
    promoCards: [
      { title: 'Modern Yemek Odaları',  image_url: null, href: '/kategori/modern-yemek-odasi' },
      { title: 'Luxury Yemek Odaları',  image_url: null, href: '/kategori/luxury-yemek-odasi' },
    ],
  },
  {
    name: 'Koltuk Takımı', slug: 'koltuk-takimi',
    sub: [
      { name: 'Modern Salon Takımı',        slug: 'modern-salon-takimi' },
      { name: 'Luxury Koltuk Takımı',        slug: 'luxury-koltuk-takimi' },
      { name: 'İskandinav Koltuk Takımı',    slug: 'iskandinav-koltuk-takimi' },
      { name: 'Chester Koltuk Takımı',       slug: 'chester-koltuk-takimi' },
      { name: 'Klasik Koltuk Takımı',        slug: 'klasik-koltuk-takimi' },
      { name: 'Dinlenme Koltuk',             slug: 'dinlenme-koltuk' },
      { name: 'L Koltuk Takımı',             slug: 'l-koltuk-takimi' },
      { name: 'U Koltuk Takımı',             slug: 'u-koltuk-takimi' },
      { name: 'Berjer Modelleri',            slug: 'berjer-modelleri' },
      { name: 'İndirimli Koltuk Takımı',     slug: 'indirimli-koltuk-takimi' },
    ],
    promoCards: [
      { title: 'Modern Salon Takımları', image_url: null, href: '/kategori/modern-salon-takimi' },
      { title: 'Luxury Koltuk Takımları', image_url: null, href: '/kategori/luxury-koltuk-takimi' },
    ],
  },
  {
    name: 'Köşe Koltuk', slug: 'kose-koltuk',
    sub: [
      { name: 'Modern Köşe Koltuk',         slug: 'modern-kose-koltuk' },
      { name: 'Luxury Köşe Koltuk',          slug: 'luxury-kose-koltuk' },
      { name: 'İskandinav Köşe Koltuk',      slug: 'iskandinav-kose-koltuk' },
      { name: 'Deri Köşe Koltuk',            slug: 'deri-kose-koltuk' },
      { name: 'Kadife Köşe Koltuk',          slug: 'kadife-kose-koltuk' },
      { name: 'L Şeklinde Köşe',             slug: 'l-seklinde-kose' },
      { name: 'U Şeklinde Köşe',             slug: 'u-seklinde-kose' },
      { name: 'Çekyat Köşe Koltuk',          slug: 'cekyat-kose-koltuk' },
      { name: 'Kanepe Modelleri',            slug: 'kanepe-modelleri' },
      { name: 'İndirimli Köşe Koltuk',       slug: 'indirimli-kose-koltuk' },
    ],
    promoCards: [
      { title: 'Modern Köşe Takımları', image_url: null, href: '/kategori/modern-kose-koltuk' },
      { title: 'Luxury Köşe Takımları', image_url: null, href: '/kategori/luxury-kose-koltuk' },
    ],
  },
  {
    name: 'TV Ünitesi', slug: 'tv-unitesi',
    sub: [
      { name: 'Modern TV Ünitesi',           slug: 'modern-tv-unitesi' },
      { name: 'Luxury TV Ünitesi',            slug: 'luxury-tv-unitesi' },
      { name: 'Ahşap TV Ünitesi',             slug: 'ahsap-tv-unitesi' },
      { name: 'İskandinav TV Ünitesi',        slug: 'iskandinav-tv-unitesi' },
      { name: 'TV Sehpası',                   slug: 'tv-sehpasi' },
      { name: 'Duvar Ünitesi',                slug: 'duvar-unitesi' },
      { name: 'Asimetrik TV Ünitesi',         slug: 'asimetrik-tv-unitesi' },
      { name: 'Kapaklı TV Ünitesi',           slug: 'kapakli-tv-unitesi' },
      { name: 'LED TV Ünitesi',               slug: 'led-tv-unitesi' },
      { name: 'İndirimli TV Ünitesi',         slug: 'indirimli-tv-unitesi' },
    ],
    promoCards: [
      { title: 'Modern TV Üniteleri',   image_url: null, href: '/kategori/modern-tv-unitesi' },
      { title: 'Luxury TV Üniteleri',   image_url: null, href: '/kategori/luxury-tv-unitesi' },
    ],
  },
  {
    name: 'Oturma Grubu', slug: 'oturma-grubu',
    sub: [
      { name: 'Kanepe',                      slug: 'kanepe' },
      { name: 'Berjer',                       slug: 'berjer' },
      { name: 'İndirimli Oturma Grubu',       slug: 'indirimli-oturma-grubu' },
      { name: 'Spor Oturma Grubu',            slug: 'spor-oturma-grubu' },
      { name: 'TV Koltuğu',                   slug: 'tv-koltugu' },
      { name: 'Çay Seti Koltuk Takımı',       slug: 'cay-seti-koltuk-takimi' },
      { name: 'Balkon Oturma Grubu',          slug: 'balkon-oturma-grubu' },
      { name: 'Deri Oturma Grubu',            slug: 'deri-oturma-grubu' },
      { name: 'Modüler Oturma Grubu',         slug: 'moduler-oturma-grubu' },
      { name: 'Luxury Oturma Grubu',          slug: 'luxury-oturma-grubu' },
    ],
    promoCards: [
      { title: 'Oturma Grupları',        image_url: null, href: '/kategori/oturma-grubu' },
      { title: 'Kanepe Modelleri',       image_url: null, href: '/kategori/kanepe' },
    ],
  },
  {
    name: 'Genç Odası', slug: 'genc-odasi',
    sub: [
      { name: 'Çalışma Masası',              slug: 'calisma-masasi' },
      { name: 'Kitaplık',                    slug: 'kitaplik' },
      { name: 'Ranza',                       slug: 'ranza' },
      { name: 'Bebek Odası',                 slug: 'bebek-odasi' },
      { name: 'Montessori',                  slug: 'montessori' },
      { name: 'Beşik',                       slug: 'besik' },
      { name: 'Karyola',                     slug: 'karyola' },
      { name: 'Masa Sandalye Takımı',        slug: 'masa-sandalye-takimi' },
      { name: 'Gençlik Koltuğu',             slug: 'genclik-koltugu' },
      { name: 'İndirimli Genç Odası',        slug: 'indirimli-genc-odasi' },
    ],
    promoCards: [
      { title: 'Genç Odası Modelleri',  image_url: null, href: '/kategori/genc-odasi' },
      { title: 'Ranza Modelleri',       image_url: null, href: '/kategori/ranza' },
    ],
  },
  { name: 'Düğün Paketi', slug: 'dugun-paketi', sub: [], promoCards: [] },
  { name: 'Outlet Ürünler', slug: 'outlet-urunler', sub: [], promoCards: [] },
  { name: 'Luxury Mobilya', slug: 'luxury-mobilya', sub: [], promoCards: [] },
  { name: 'İskandinav Mobilya', slug: 'iskandinav-mobilya', sub: [], promoCards: [] },
  { name: 'Fırsat Ürünleri', slug: 'firsat-urunleri', sub: [], promoCards: [] },
]

/* ─── Promo Card ─────────────────────────────────────────────────────── */
function PromoCard({
  title,
  imageUrl,
  href,
}: {
  title: string
  imageUrl?: string | null
  href: string
}) {
  return (
    <Link
      href={href}
      className="group/card relative flex-1 min-h-[240px] overflow-hidden rounded-lg"
      style={{ background: '#F8F8F6' }}
    >
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
            sizes="50vw"
          />
        ) : (
          <div className="w-full h-full bg-neutral-200/60" />
        )}
      </div>
    </Link>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function HeaderMegaMenu({
  categories = [],
  logoUrl,
  logoAlt = 'Logo',
}: Props) {
  const navCategories = categories.length > 0 ? categories : DEMO_CATEGORIES

  const [mounted,       setMounted]       = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [userMenuOpen,  setUserMenuOpen]  = useState(false)
  const [allCatsOpen,   setAllCatsOpen]   = useState(false)
  const [hoveredCat,    setHoveredCat]    = useState<string | null>(null)
  const [mobileCatOpen, setMobileCatOpen] = useState<string | null>(null)
  const [user,          setUser]          = useState<SupabaseUser | null>(null)

  const userMenuRef = useRef<HTMLDivElement>(null)

  const totalItems     = useCartStore((s) => s.totalItems())
  const totalFavorites = useFavoritesStore((s) => s.total())

  /* auth */
  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, sess) => {
      setUser(sess?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  /* outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleLogout = async () => {
    await createClient().auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
  }

  /* partition for "Tüm Kategoriler" panel */
  const withSub    = navCategories.filter((c) => c.sub.length > 0)
  const withoutSub = navCategories.filter((c) => c.sub.length === 0)

  /* ── Logo ── */
  const logo = logoUrl ? (
    <div style={{ height: '32px', flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={logoAlt}
        style={{ height: '100%', width: 'auto', display: 'block' }}
      />
    </div>
  ) : (
    <span className="text-[18px] tracking-tight select-none leading-none">
      <span className="font-light text-neutral-800">Mobilya</span>
      <span className="font-bold  text-neutral-900">Store</span>
    </span>
  )

  /* ──────────────────────────────────────────────────────────────────── */
  return (
    <header className="w-full bg-white border-b border-neutral-100">

      {/* ═══════════════ ROW 1 ═══════════════ */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[56px] md:h-[84px] relative">

          {/* LEFT — hamburger (mobile) + logo (desktop) */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1 text-neutral-700"
              aria-label="Menü"
            >
              <Menu size={24} strokeWidth={1.7} />
            </button>
            <Link href="/" className="hidden md:block">{logo}</Link>
          </div>

          {/* MOBILE — logo ortada */}
          <Link href="/" className="md:hidden absolute left-1/2 -translate-x-1/2">{logo}</Link>

          {/* CENTER — search (desktop) */}
          <div className="flex-1 flex justify-center px-6">
            <div className="hidden md:block w-full max-w-[520px]">
              <SearchBar borderless />
            </div>
          </div>

          {/* RIGHT — user / favorites / cart */}
          <div className="flex items-center gap-4 flex-shrink-0 justify-end ml-auto">

            {/* User */}
            <div className="relative hidden md:flex" ref={userMenuRef}>
              {mounted && !user ? (
                <Link href="/auth/giris" className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="text-[13px] font-medium">Giriş Yap</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="text-[13px] font-medium">Hesabım</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {mounted && user && userMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-60 bg-white rounded-2xl shadow-xl border border-neutral-100 z-50 overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-neutral-100">
                    <p className="text-[11px] text-neutral-400">Merhaba</p>
                    <p className="text-sm font-semibold text-neutral-900 mt-0.5 truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı'}
                    </p>
                  </div>
                  <div className="py-1">
                    {([
                      { label: 'Siparişlerim',      href: '/hesabim'               },
                      { label: 'Arıza / İade',      href: '/hesabim?tab=iade'      },
                      { label: 'Favorilerim',        href: '/hesabim?tab=favoriler' },
                      { label: 'Adreslerim',         href: '/hesabim?tab=adresler'  },
                      { label: 'MessaPuanım',        href: '/hesabim?tab=puan'      },
                      { label: 'Hediye Çeklerim',    href: '/hesabim?tab=hediye'    },
                      { label: 'Üyelik Bilgilerim',  href: '/hesabim?tab=profil'    },
                      { label: 'Şifre Değiştirme',   href: '/hesabim?tab=sifre'     },
                    ] as { label: string; href: string }[]).map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-neutral-100 py-1">
                    {user.app_metadata?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors">
                        <LayoutDashboard size={13} /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors">
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Favorites */}
            <Link href="/favorilerim" className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 transition-colors" aria-label="Favorilerim">
              <div className="relative">
                <Heart size={22} strokeWidth={1.6} className="md:w-5 md:h-5" />
                {mounted && totalFavorites > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-[15px] h-[15px] rounded-full flex items-center justify-center font-semibold">
                    {totalFavorites}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-[13px] font-medium">Favorilerim</span>
            </Link>

            {/* Cart */}
            <Link href="/sepet" className="flex items-center gap-1.5 text-neutral-700 hover:text-neutral-900 transition-colors" aria-label="Sepetim">
              <div className="relative">
                <ShoppingCart size={22} strokeWidth={1.6} className="md:w-5 md:h-5" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[9px] w-[15px] h-[15px] rounded-full flex items-center justify-center font-semibold">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-[13px] font-medium">Sepetim</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile search bar — her zaman görünür */}
      <div className="md:hidden px-4 py-2.5 border-t border-neutral-100 bg-white">
        <SearchBar mobile />
      </div>

      {/* ═══════════════ ROW 2 — Desktop Nav ═══════════════ */}
      {navCategories.length > 0 && (
        <div className="hidden md:block border-t border-neutral-100">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

            {/*
              OUTER wrapper — relative, tüm nav'ı kapsar.
              Tüm Kategoriler paneli buradan left-0/right-0 alır (tam genişlik).
            */}
            <div
              className="relative flex items-stretch justify-center h-[46px]"
              onMouseLeave={() => { setAllCatsOpen(false); setHoveredCat(null) }}
            >

              {/* ── Tüm Kategoriler ── hover ile açılır ── */}
              <div
                className="flex items-stretch flex-shrink-0"
                onMouseEnter={() => { setAllCatsOpen(true); setHoveredCat(null) }}
              >
                <button
                  type="button"
                  className={`relative flex items-center gap-1.5 px-5 text-[13.5px] font-medium transition-colors whitespace-nowrap ${
                    allCatsOpen ? 'text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Tüm Kategoriler
                  <ChevronDown size={13} className={`transition-transform duration-200 ${allCatsOpen ? 'rotate-180' : ''}`} />
                  <span className={`absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900 transition-transform duration-200 ${allCatsOpen ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>
              </div>

              {/* ── Kategori linkleri ── inner relative wrapper ── */}
              <div className="relative flex items-stretch">
                {navCategories.slice(0, 8).map((cat) => {
                  const hasDropdown = cat.sub.length > 0 || (cat.promoCards?.length ?? 0) > 0
                  const isActive    = hoveredCat === cat.slug
                  return (
                    <div
                      key={cat.slug}
                      className="flex items-stretch flex-shrink-0"
                      onMouseEnter={() => { setAllCatsOpen(false); hasDropdown ? setHoveredCat(cat.slug) : setHoveredCat(null) }}
                    >
                      <Link
                        href={`/kategori/${cat.slug}`}
                        className={`relative flex items-center gap-1.5 px-5 text-[13.5px] transition-colors whitespace-nowrap ${
                          isActive ? 'text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {cat.name}
                        {hasDropdown && (
                          <ChevronDown size={13} className={`transition-transform duration-200 ${isActive ? 'rotate-180 text-neutral-700' : 'text-neutral-400'}`} />
                        )}
                        <span className={`absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900 transition-transform duration-200 origin-center ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
                      </Link>
                    </div>
                  )
                })}

                {/* Kategori mega menü — inner wrapper'ın genişliği = Yatak Odası → Düğün Paketi */}
                {hoveredCat && (() => {
                  const cat = navCategories.find((c) => c.slug === hoveredCat)
                  if (!cat) return null
                  const hasCards = (cat.promoCards?.length ?? 0) > 0
                  return (
                    <div className="absolute left-0 top-full z-40 flex bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] min-w-[680px] max-w-[calc(100vw-2rem)] overflow-x-hidden">
                      {cat.sub.length > 0 && (
                        <div className="w-[230px] flex-shrink-0 py-6 px-7 border-r border-neutral-100">
                          <Link href={`/kategori/${cat.slug}`}
                            className="flex items-center gap-1.5 text-[14px] font-semibold text-neutral-900 hover:text-[#222222] transition-colors mb-5">
                            {cat.name}
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                              <path d="M11.7 3.9l5.6 5.7a1 1 0 0 1 0 1.4L11.7 16c-.3.3-.7.4-1.1.3a1 1 0 0 1-.6-1.7l4.6-4.6H3.1a1 1 0 0 1 0-2h11.5L10 3.4a1 1 0 0 1 1.7-1.2l-.1.1z" fill="currentColor" />
                            </svg>
                          </Link>
                          <ul className="space-y-0.5">
                            {cat.sub.map((s) => (
                              <li key={s.slug}>
                                <Link href={`/kategori/${s.slug}`}
                                  className="block py-[7px] text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors">
                                  {s.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hasCards && (
                        <div className="flex gap-4 p-5 flex-1">
                          {cat.promoCards!.slice(0, 2).map((card, i) => (
                            <PromoCard key={i} title={card.title} imageUrl={card.image_url} href={card.href || `/kategori/${cat.slug}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Tüm Kategoriler paneli — OUTER wrapper'ın genişliği = Tüm Kategoriler → Düğün Paketi */}
              {allCatsOpen && (
                <div className="absolute left-0 right-0 top-full z-50 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-8">
                  <div className="grid grid-cols-5 gap-x-6 gap-y-8">
                    {withSub.map((cat) => (
                      <div key={cat.slug}>
                        <Link href={`/kategori/${cat.slug}`}
                          className="font-semibold text-[13.5px] text-neutral-900 hover:text-[#222222] transition-colors block mb-3">
                          {cat.name}
                        </Link>
                        <ul className="space-y-2">
                          {cat.sub.map((s) => (
                            <li key={s.slug}>
                              <Link href={`/kategori/${s.slug}`}
                                className="text-[12.5px] text-neutral-500 hover:text-neutral-900 transition-colors block leading-snug">
                                {s.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  {withoutSub.length > 0 && (
                    <div className="mt-7 pt-6 border-t border-neutral-100 grid grid-cols-5 gap-x-6 gap-y-3">
                      {withoutSub.map((cat) => (
                        <Link key={cat.slug} href={`/kategori/${cat.slug}`}
                          className="font-semibold text-[13.5px] text-neutral-900 hover:text-[#222222] transition-colors">
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ═══════════════ Mobile Drawer ═══════════════ */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 overflow-y-auto shadow-2xl md:hidden flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
              <Link href="/" onClick={() => setMobileOpen(false)}>{logo}</Link>
              <button onClick={() => setMobileOpen(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors" aria-label="Kapat">
                <X size={18} />
              </button>
            </div>

            {/* Auth row */}
            {mounted && (
              !user ? (
                <div className="px-5 py-3.5 border-b border-neutral-100 flex gap-2 flex-shrink-0">
                  <Link href="/auth/giris" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2 text-sm bg-neutral-900 text-white rounded-xl font-medium">
                    Giriş Yap
                  </Link>
                  <Link href="/auth/kayit" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2 text-sm border border-neutral-200 rounded-xl text-neutral-700">
                    Kayıt Ol
                  </Link>
                </div>
              ) : (
                <div className="border-b border-neutral-100 flex-shrink-0">
                  <div className="px-5 py-3 flex items-center justify-between">
                    <p className="text-xs text-neutral-400">
                      Merhaba, <span className="font-semibold text-neutral-900">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                    </p>
                    <button onClick={() => { handleLogout(); setMobileOpen(false) }}
                      className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors">Çıkış</button>
                  </div>
                  <div className="px-3 pb-3 grid grid-cols-2 gap-1">
                    {([
                      { label: 'Siparişlerim',      href: '/hesabim'               },
                      { label: 'Arıza / İade',      href: '/hesabim?tab=iade'      },
                      { label: 'Favorilerim',        href: '/hesabim?tab=favoriler' },
                      { label: 'Adreslerim',         href: '/hesabim?tab=adresler'  },
                      { label: 'MessaPuanım',        href: '/hesabim?tab=puan'      },
                      { label: 'Hediye Çeklerim',    href: '/hesabim?tab=hediye'    },
                      { label: 'Üyelik Bilgilerim',  href: '/hesabim?tab=profil'    },
                      { label: 'Şifre Değiştirme',   href: '/hesabim?tab=sifre'     },
                    ] as { label: string; href: string }[]).map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                        className="px-3 py-2 text-[12px] text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors">
                        {item.label}
                      </Link>
                    ))}
                    {user.app_metadata?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)}
                        className="col-span-2 px-3 py-2 text-[12px] text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors">
                        Admin Panel
                      </Link>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Category list */}
            <nav className="flex-1 overflow-y-auto">
              {navCategories.map((cat) => (
                <div key={cat.slug}>
                  <div className="flex items-center border-b border-neutral-100">
                    <Link
                      href={`/kategori/${cat.slug}`}
                      className="flex-1 px-5 py-3.5 text-[14px] text-neutral-700 hover:text-neutral-900 transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {cat.name}
                    </Link>
                    {cat.sub.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMobileCatOpen(mobileCatOpen === cat.slug ? null : cat.slug)}
                        className="px-4 py-3.5 text-neutral-400"
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${mobileCatOpen === cat.slug ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {mobileCatOpen === cat.slug && (
                    <div className="bg-neutral-50">
                      {cat.sub.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/kategori/${s.slug}`}
                          className="flex items-center pl-9 pr-5 py-2.5 text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors border-b border-neutral-100/60"
                          onClick={() => setMobileOpen(false)}
                        >
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Bottom bar */}
            <div className="flex-shrink-0 border-t border-neutral-100 px-5 py-4 flex items-center gap-4">
              <Link href="/favorilerim" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-[13px] text-neutral-600">
                <Heart size={16} strokeWidth={1.5} /> Favorilerim
                {mounted && totalFavorites > 0 && (
                  <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{totalFavorites}</span>
                )}
              </Link>
              <Link href="/sepet" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-[13px] text-neutral-600 ml-auto">
                Sepetim
                {mounted && totalItems > 0 && (
                  <span className="bg-neutral-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>
                )}
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
