'use client'

import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  initialVisible: boolean
}

export default function ServicesSectionManager({ initialVisible }: Props) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Hizmetler Bölümü (Neden MobilyaStore?)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ana sayfadaki &quot;Neden MobilyaStore?&quot; hizmet kartları. İçerik &quot;Hizmetler&quot; sayfasından yönetilir.
          </p>
        </div>
        <SectionVisibilityToggle sectionKey="services_section" initialVisible={initialVisible} />
      </div>
    </div>
  )
}
