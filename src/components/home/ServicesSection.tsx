import { createClient } from '@/lib/supabase/server'

async function getServices() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order')
    return data ?? []
  } catch { return [] }
}

export default async function ServicesSection() {
  const services = await getServices()
  if (services.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold">Neden MobilyaStore?</h2>
        <p className="text-muted-foreground mt-2">Size en iyi alışveriş deneyimini sunmak için buradayız</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {services.map((s: any) => (
          <div key={s.id} className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl hover:bg-secondary transition-colors">
            <span className="text-4xl">{s.icon}</span>
            <div>
              <p className="font-semibold text-sm">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
