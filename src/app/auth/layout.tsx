import HeaderMegaMenu, { MegaMenuCategory } from '@/components/HeaderMegaMenu'
import TopBar from '@/components/layout/TopBar'
import { getLogoSettings } from '@/lib/repositories/settings'
import { createClient } from '@/lib/supabase/server'
import { Category, CategoryPromoCard } from '@/types'

async function getNavCategories(): Promise<MegaMenuCategory[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    const categories = (data as Category[]) ?? []
    const parents = categories.filter((c) => !c.parent_id)
    return parents.map((parent) => ({
      name: parent.name,
      slug: parent.slug,
      sub: categories
        .filter((c) => c.parent_id === parent.id)
        .map((c) => ({ name: c.name, slug: c.slug })),
      promoCards: (parent.promo_cards as CategoryPromoCard[]) ?? [],
    }))
  } catch {
    return []
  }
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [categories, logo] = await Promise.all([getNavCategories(), getLogoSettings()])
  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col">
      <div className="sticky top-0 z-50">
        <TopBar />
        <HeaderMegaMenu categories={categories} logoUrl={logo?.image_url} logoAlt={logo?.alt} />
      </div>
      <main className="flex-1">{children}</main>
    </div>
  )
}
