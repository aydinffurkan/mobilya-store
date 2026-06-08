'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingCart, Heart, User, Menu, X, Search, Phone, LogOut, LayoutDashboard, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { CategoryPromoCard } from '@/types'

export interface NavCategory {
  name: string
  slug: string
  sub: { name: string; slug: string }[]
  promoCards?: CategoryPromoCard[]
}

interface HeaderProps {
  phone?: string
  categories?: NavCategory[]
}

export default function Header({ phone = '444 21 05', categories = [] }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const totalItems = useCartStore((s) => s.totalItems())

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      {/* Top bar */}
      <div className="bg-[#8B6914] text-white text-xs py-1.5 px-4 text-center hidden md:block">
        <span className="flex items-center justify-center gap-6">
          <span className="flex items-center gap-1"><Phone size={11} /> {phone}</span>
          <span>Ücretsiz Nakliye & Kurulum – Tüm Türkiye</span>
          <span>2 Yıl Garanti</span>
        </span>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-2xl font-bold tracking-tight text-[#8B6914]">
            MOBİLYA<span className="text-foreground">STORE</span>
          </span>
        </Link>

        {/* Search bar — desktop */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ürün veya kategori ara..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40"
            />
          </div>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(!searchOpen)}>
            <Search size={20} />
          </Button>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors"
            >
              <User size={20} />
            </button>
            {mounted && userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                {user ? (
                  <>
                    <p className="px-3 py-2 text-xs text-muted-foreground truncate border-b border-border">{user.email}</p>
                    <Link href="/hesabim" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                      <User size={14} /> Hesabım
                    </Link>
                    {user.app_metadata?.role === 'admin' && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                        <LayoutDashboard size={14} /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors text-destructive">
                      <LogOut size={14} /> Çıkış Yap
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/giris" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                      <User size={14} /> Giriş Yap
                    </Link>
                    <Link href="/auth/kayit" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                      Kayıt Ol
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <button className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors">
            <Heart size={20} />
          </button>
          <Link href="/sepet" className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors">
            <ShoppingCart size={20} />
            {mounted && totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#8B6914] hover:bg-[#8B6914]">
                {totalItems}
              </Badge>
            )}
          </Link>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors">
              <Menu size={20} />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex items-center justify-between px-4 py-4 border-b">
                <span className="font-bold text-[#8B6914]">Kategoriler</span>
                <button className="p-1 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <nav className="overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat.slug}>
                    <Link
                      href={`/kategori/${cat.slug}`}
                      className="flex items-center px-4 py-3 text-sm font-medium hover:bg-secondary border-b border-border/50"
                      onClick={() => setMobileOpen(false)}
                    >
                      {cat.name}
                    </Link>
                    {cat.sub.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/kategori/${sub.slug}`}
                        className="flex items-center pl-8 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        onClick={() => setMobileOpen(false)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ürün veya kategori ara..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Desktop category nav */}
      <nav className="hidden md:block border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-0">
            {categories.map((cat) => (
              <li key={cat.slug} className="group relative">
                <Link
                  href={`/kategori/${cat.slug}`}
                  className="relative flex items-center px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-foreground/80 hover:text-[#8B6914] transition-colors after:absolute after:left-4 after:right-4 after:bottom-0 after:h-0.5 after:bg-[#8B6914] after:scale-x-0 group-hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-center"
                >
                  {cat.name}
                </Link>
                {(cat.sub.length > 0 || (cat.promoCards?.length ?? 0) > 0) && (
                  <div className="absolute left-0 top-full hidden group-hover:block z-50 pt-0">
                    <div className="bg-white border border-border border-t-2 border-t-[#8B6914] rounded-b-xl shadow-xl px-6 py-5 flex items-start gap-8">
                      {cat.sub.length > 0 && (
                        <div className="min-w-[320px]">
                          <p className="text-[11px] font-semibold text-[#8B6914] uppercase tracking-widest mb-3">{cat.name}</p>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                            {cat.sub.map((sub) => (
                              <Link
                                key={sub.slug}
                                href={`/kategori/${sub.slug}`}
                                className="px-2.5 py-1.5 -mx-2.5 rounded-lg text-sm text-muted-foreground hover:text-[#8B6914] hover:bg-secondary transition-colors whitespace-nowrap"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                          <Link
                            href={`/kategori/${cat.slug}`}
                            className="inline-flex items-center gap-1.5 mt-4 pt-3 border-t border-border/60 w-full text-sm font-medium text-[#8B6914] hover:gap-2.5 transition-all"
                          >
                            Tüm {cat.name} Ürünleri <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                      {(cat.promoCards?.length ?? 0) > 0 && (
                        <div className={`flex items-start gap-6 ${cat.sub.length > 0 ? 'pl-8 border-l border-border/60' : ''}`}>
                          {cat.promoCards!.map((card, i) => (
                            <Link
                              key={i}
                              href={card.href || `/kategori/${cat.slug}`}
                              className="flex flex-col items-center gap-2 w-24 group/card"
                            >
                              <span className="w-20 h-20 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0 transition-transform group-hover/card:scale-105">
                                {card.image_url ? (
                                  <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">Görsel</span>
                                )}
                              </span>
                              <span className="text-xs text-center text-foreground/80 group-hover/card:text-[#8B6914] transition-colors leading-tight">
                                {card.title}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
