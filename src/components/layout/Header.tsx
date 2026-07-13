'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Heart, X, LayoutDashboard, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useFavoritesStore } from '@/store/favoritesStore'
import { createClient } from '@/lib/supabase/client'
import { CategoryPromoCard, LogoData } from '@/types'
import Image from 'next/image'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import SearchBar from '@/components/layout/SearchBar'

export interface NavCategory {
  name: string
  slug: string
  sub: { name: string; slug: string }[]
  promoCards?: CategoryPromoCard[]
}

interface HeaderProps {
  categories?: NavCategory[]
  logo?: LogoData
}

export default function Header({ categories = [], logo }: HeaderProps) {
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [mounted,       setMounted]       = useState(false)
  const [user,          setUser]          = useState<SupabaseUser | null>(null)
  const [userMenuOpen,  setUserMenuOpen]  = useState(false)
  const [allCatsOpen,   setAllCatsOpen]   = useState(false)
  const [mobileCatOpen, setMobileCatOpen] = useState<string | null>(null)

  const userMenuRef = useRef<HTMLDivElement>(null)
  const allCatsRef  = useRef<HTMLDivElement>(null)

  const totalItems     = useCartStore((s) => s.totalItems())
  const totalFavorites = useFavoritesStore((s) => s.total())

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
      if (allCatsRef.current  && !allCatsRef.current.contains(e.target as Node))  setAllCatsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await createClient().auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
  }

  /* ── Logo ── */
  const logoEl = logo?.image_url ? (
    <div className="relative h-[14px] w-[56px] sm:h-4 sm:w-[64px]">
      <Image src={logo.image_url} alt={logo.alt || 'Logo'} fill className="object-contain" sizes="128px" priority />
    </div>
  ) : (
    <span className="text-[18px] tracking-tight select-none leading-none">
      <span className="font-light text-neutral-800">Mobilya</span>
      <span className="font-bold  text-neutral-900">Store</span>
    </span>
  )

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-neutral-100">

      {/* ══ ROW 1 ══ Hamburger │ Arama   Logo   Kullanıcı / Favori / Sepet */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[68px]">

          {/* SOL: Hamburger (mobil) + Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Hamburger — sadece mobil */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1 text-neutral-700 hover:text-neutral-900 transition-colors"
              aria-label="Menü"
            >
              <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
                <rect width="24" height="2" rx="1" fill="currentColor" />
                <rect y="6"  width="24" height="2" rx="1" fill="currentColor" />
                <rect y="12" width="16" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/">{logoEl}</Link>
          </div>

          {/* MERKEZ: Arama */}
          <div className="flex-1 flex justify-center px-6">
            <div className="hidden md:block w-full max-w-[520px]">
              <SearchBar borderless />
            </div>
          </div>

          {/* SAĞ: Kullanıcı + Favori + Sepet + Mobil Arama */}
          <div className="flex items-center gap-4 flex-shrink-0 justify-end">

            {/* Arama ikonu — sadece mobil */}
            <button
              type="button"
              onClick={() => setSearchOpen((s) => !s)}
              className="md:hidden p-1 text-neutral-500 hover:text-neutral-900 transition-colors"
              aria-label="Arama"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {/* Kullanıcı — sadece desktop */}
            <div className="relative hidden md:flex items-center" ref={userMenuRef}>
              {mounted && !user ? (
                <Link href="/auth/giris"
                  className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </Link>
              ) : (
                <button type="button" onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {mounted && user && userMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-neutral-100 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3.5 border-b border-neutral-100">
                    <p className="text-[11px] text-neutral-400">Merhaba</p>
                    <p className="text-sm font-semibold text-neutral-900 mt-0.5 truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı'}
                    </p>
                  </div>
                  <div className="py-1">
                    {[
                      
                      { label: 'Siparişlerim',      href: '/hesabim'             },
                      { label: 'Üyelik Bilgilerim',  href: '/hesabim?tab=profil'  },
                      { label: 'Şifre Değiştirme',   href: '/hesabim?tab=sifre'   },
                    ].map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
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

            {/* Favoriler */}
            <Link href="/favorilerim"
              className="relative text-neutral-600 hover:text-neutral-900 transition-colors"
              aria-label="Favorilerim">
              <Heart size={22} strokeWidth={1.6} />
              {mounted && totalFavorites > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-[15px] h-[15px] rounded-full flex items-center justify-center font-semibold">
                  {totalFavorites}
                </span>
              )}
            </Link>

            {/* Sepet */}
            <Link href="/sepet"
              className="relative text-neutral-700 hover:text-neutral-900 transition-colors"
              aria-label="Sepetim">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[9px] w-[15px] h-[15px] rounded-full flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobil arama açılır */}
      {searchOpen && (
        <div className="md:hidden px-4 py-3 border-t border-neutral-100 bg-white">
          <SearchBar mobile onClose={() => setSearchOpen(false)} />
        </div>
      )}

      {/* ══ ROW 2 ══ Desktop kategori navigasyonu */}
      {categories.length > 0 && (
        <div className="hidden md:block border-t border-neutral-100">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-stretch justify-center h-[46px]">

              {/* ── Tüm Kategoriler ── */}
              <div className="relative flex items-stretch flex-shrink-0" ref={allCatsRef}>
                <button
                  type="button"
                  onClick={() => setAllCatsOpen(!allCatsOpen)}
                  className={`flex items-center gap-1.5 px-5 text-[13.5px] font-medium transition-colors whitespace-nowrap relative group ${
                    allCatsOpen ? 'text-neutral-900' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Tüm Kategoriler
                  <ChevronDown size={13} className={`transition-transform duration-200 ${allCatsOpen ? 'rotate-180' : ''}`} />
                  <span className={`absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900 transition-transform duration-200 ${allCatsOpen ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>

                {allCatsOpen && (
                  <div className="absolute left-0 top-full bg-white border-t-2 border-neutral-900 shadow-2xl z-50 p-8 w-[920px]">
                    {(() => {
                      const withSub    = categories.filter((c) => c.sub.length > 0)
                      const withoutSub = categories.filter((c) => c.sub.length === 0)
                      return (
                        <>
                          <div className="grid grid-cols-5 gap-x-6 gap-y-8">
                            {withSub.map((cat) => (
                              <div key={cat.slug}>
                                <Link
                                  href={`/kategori/${cat.slug}`}
                                  onClick={() => setAllCatsOpen(false)}
                                  className="font-semibold text-[13.5px] text-neutral-900 hover:text-[#222222] transition-colors block mb-3"
                                >
                                  {cat.name}
                                </Link>
                                <ul className="space-y-2">
                                  {cat.sub.map((sub) => (
                                    <li key={sub.slug}>
                                      <Link
                                        href={`/kategori/${sub.slug}`}
                                        onClick={() => setAllCatsOpen(false)}
                                        className="text-[12.5px] text-neutral-500 hover:text-neutral-900 transition-colors block leading-snug"
                                      >
                                        {sub.name}
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
                                <Link
                                  key={cat.slug}
                                  href={`/kategori/${cat.slug}`}
                                  onClick={() => setAllCatsOpen(false)}
                                  className="font-semibold text-[13.5px] text-neutral-900 hover:text-[#222222] transition-colors"
                                >
                                  {cat.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* ── Kategori linkleri ── */}
              {categories.slice(0, 8).map((cat) => {
                const hasSub = cat.sub.length > 0 || (cat.promoCards?.length ?? 0) > 0
                return (
                  <div key={cat.slug} className="group relative flex items-stretch flex-shrink-0">
                    <Link
                      href={`/kategori/${cat.slug}`}
                      className="flex items-center gap-1.5 px-5 text-[13.5px] text-neutral-600 hover:text-neutral-900 transition-colors whitespace-nowrap relative"
                    >
                      {cat.name}
                      {hasSub && (
                        <ChevronDown size={13} className="text-neutral-400 group-hover:text-neutral-700 transition-colors" />
                      )}
                      {/* hover alt çizgisi */}
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
                    </Link>

                    {/* ── Mega dropdown ── */}
                    {hasSub && (
                      <div className="absolute left-0 top-full hidden group-hover:flex z-50 shadow-xl border-t-2 border-t-neutral-900 bg-white">

                        {/* Sol: alt kategori listesi */}
                        {cat.sub.length > 0 && (
                          <div className="w-[190px] flex-shrink-0 py-5 px-5 border-r border-neutral-100">
                            <Link
                              href={`/kategori/${cat.slug}`}
                              className="flex items-center gap-1.5 text-[13.5px] font-semibold text-neutral-900 hover:text-[#222222] transition-colors mb-4"
                            >
                              {cat.name}
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
                                <path d="M11.7 3.9l5.6 5.7a1 1 0 0 1 0 1.4L11.7 16c-.3.3-.7.4-1.1.3a1 1 0 0 1-.6-1.7l4.6-4.6H3.1a1 1 0 0 1 0-2h11.5L10 3.4a1 1 0 0 1 1.7-1.2l-.1.1z" fill="currentColor"/>
                              </svg>
                            </Link>
                            <ul className="space-y-0.5">
                              {cat.sub.map((sub) => (
                                <li key={sub.slug}>
                                  <Link
                                    href={`/kategori/${sub.slug}`}
                                    className="block py-[6px] text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors"
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Sağ: Cadde Yıldız stili kart — başlık üstte, görsel altta */}
                        {(cat.promoCards?.length ?? 0) > 0 && (
                          <div className="flex gap-3 p-4">
                            {cat.promoCards!.slice(0, 2).map((card, i) => (
                              <Link
                                key={i}
                                href={card.href || `/kategori/${cat.slug}`}
                                className="relative flex flex-col w-[300px] h-[230px] overflow-hidden rounded-md bg-neutral-100 group/card flex-shrink-0"
                              >
                                {/* Başlık + buton */}
                                <div className="relative z-10 p-4 pb-0">
                                  <p className="text-[14.5px] font-semibold text-neutral-900 leading-snug mb-2.5">
                                    {card.title}
                                  </p>
                                  <span className="inline-block text-[11.5px] text-neutral-700 border border-neutral-300 rounded-full px-3 py-1 bg-white/80 group-hover/card:bg-white transition-colors">
                                    Ürünleri İncele
                                  </span>
                                </div>

                                {/* Görsel — altta taşan */}
                                {card.image_url ? (
                                  <div className="absolute bottom-0 left-0 right-0 h-[155px]">
                                    <Image
                                      src={card.image_url}
                                      alt={card.title}
                                      fill
                                      loading="lazy"
                                      className="object-cover object-top transition-transform duration-500 group-hover/card:scale-[1.03]"
                                      sizes="300px"
                                    />
                                  </div>
                                ) : (
                                  <div className="absolute bottom-0 left-0 right-0 h-[155px] flex items-center justify-center">
                                    <span className="text-[11px] text-neutral-400">{card.title}</span>
                                  </div>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ══ Mobil Drawer ══ */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 overflow-y-auto shadow-2xl md:hidden flex flex-col">

            {/* Başlık */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
              <Link href="/" onClick={() => setMobileOpen(false)}>{logoEl}</Link>
              <button onClick={() => setMobileOpen(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors" aria-label="Kapat">
                <X size={18} />
              </button>
            </div>

            {/* Kullanıcı alanı */}
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
                <div className="px-5 py-3.5 border-b border-neutral-100 flex-shrink-0">
                  <p className="text-xs text-neutral-400">
                    Merhaba, <span className="font-semibold text-neutral-900">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Link href="/hesabim" onClick={() => setMobileOpen(false)} className="text-xs text-neutral-700 underline underline-offset-2">Hesabım</Link>
                    {user.app_metadata?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-xs text-neutral-700 underline underline-offset-2">Admin</Link>
                    )}
                    <button onClick={() => { handleLogout(); setMobileOpen(false) }}
                      className="text-xs text-neutral-400 underline underline-offset-2 ml-auto">Çıkış</button>
                  </div>
                </div>
              )
            )}

            {/* Kategori listesi */}
            <nav className="flex-1 overflow-y-auto">
              {categories.map((cat) => (
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
                        className="px-4 py-3.5 text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        <ChevronDown size={14} className={`transition-transform duration-200 ${mobileCatOpen === cat.slug ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {mobileCatOpen === cat.slug && (
                    <div className="bg-neutral-50">
                      {cat.sub.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/kategori/${sub.slug}`}
                          className="flex items-center pl-9 pr-5 py-2.5 text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors border-b border-neutral-100/60"
                          onClick={() => setMobileOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Alt: Favori + Sepet */}
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
