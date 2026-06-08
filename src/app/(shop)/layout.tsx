import Header, { NavCategory } from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { Category, CategoryPromoCard } from '@/types'

async function getContact() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'contact').single()
    return data?.value ?? {}
  } catch { return {} }
}

async function getNavCategories(): Promise<NavCategory[]> {
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

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [contact, categories] = await Promise.all([getContact(), getNavCategories()])
  return (
    <>
      <Header phone={contact.phone ?? '444 21 05'} categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
