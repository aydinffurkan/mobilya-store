'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Heart, User, Menu, X, Search, Phone } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

const categories = [
  {
    name: 'Yatak Odası',
    slug: 'yatak-odasi',
    sub: ['Modern', 'Klasik', 'Ahşap', 'Lüks', 'İskandinav'],
  },
  {
    name: 'Yemek Odası',
    slug: 'yemek-odasi',
    sub: ['Takımlar', 'Sandalyeler', 'Masalar'],
  },
  {
    name: 'Koltuk & Oturma',
    slug: 'koltuk-oturma',
    sub: ['Köşe Koltuk', 'Tekli Koltuk', 'Oturma Grubu'],
  },
  { name: 'Genç Odası', slug: 'genc-odasi', sub: [] },
  { name: 'TV Ünitesi', slug: 'tv-unitesi', sub: [] },
  { name: 'Bahçe Mobilyası', slug: 'bahce-mobilyasi', sub: [] },
  { name: 'Dekorasyon', slug: 'dekorasyon', sub: [] },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      {/* Top bar */}
      <div className="bg-[#8B6914] text-white text-xs py-1.5 px-4 text-center hidden md:block">
        <span className="flex items-center justify-center gap-6">
          <span className="flex items-center gap-1"><Phone size={11} /> 444 21 05</span>
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
          <Link href="/auth/giris" className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors">
            <User size={20} />
          </Link>
          <button className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors">
            <Heart size={20} />
          </button>
          <Link href="/sepet" className="relative inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
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
                        key={sub}
                        href={`/kategori/${cat.slug}?alt=${sub.toLowerCase()}`}
                        className="flex items-center pl-8 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        onClick={() => setMobileOpen(false)}
                      >
                        {sub}
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
                  className="flex items-center px-4 py-2.5 text-sm font-medium hover:text-[#8B6914] hover:bg-secondary transition-colors"
                >
                  {cat.name}
                </Link>
                {cat.sub.length > 0 && (
                  <div className="absolute left-0 top-full hidden group-hover:block bg-white border border-border rounded-lg shadow-lg py-2 min-w-40 z-50">
                    {cat.sub.map((sub) => (
                      <Link
                        key={sub}
                        href={`/kategori/${cat.slug}?alt=${sub.toLowerCase()}`}
                        className="block px-4 py-2 text-sm hover:bg-secondary hover:text-[#8B6914]"
                      >
                        {sub}
                      </Link>
                    ))}
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
