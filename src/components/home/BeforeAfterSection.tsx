import { createAdminClient } from '@/lib/supabase/admin'
import BeforeAfterSlider from './BeforeAfterSlider'

interface BeforeAfterData {
  enabled: boolean
  title?: string
  subtitle?: string
  left_image: string
  right_image: string
  left_label?: string
  right_label?: string
}

async function getData(): Promise<BeforeAfterData | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'before_after')
      .single()
    const val = data?.value as BeforeAfterData | null
    if (!val?.enabled || !val.left_image || !val.right_image) return null
    return val
  } catch {
    return null
  }
}

export default async function BeforeAfterSection() {
  const data = await getData()
  if (!data) return null

  return (
    <section className="w-full bg-white py-12">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {(data.title || data.subtitle) && (
          <div className="text-center mb-8">
            {data.title && (
              <h2 className="text-xl md:text-2xl font-medium text-[#222] tracking-wide mb-2">{data.title}</h2>
            )}
            {data.subtitle && (
              <p className="text-[13px] md:text-sm text-[#999] font-light">{data.subtitle}</p>
            )}
          </div>
        )}
        <BeforeAfterSlider
          leftImage={data.left_image}
          rightImage={data.right_image}
          leftLabel={data.left_label}
          rightLabel={data.right_label}
        />
      </div>
    </section>
  )
}
