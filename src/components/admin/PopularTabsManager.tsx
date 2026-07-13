'use client'

import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  initialVisible: boolean
}

export default function PopularTabsManager({ initialVisible }: Props) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Popüler Sekmeler (Kategori Carousel)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kategorilere göre ürün sekmelerinin gösterildiği carousel bölümü. İçerik veritabanından otomatik çekilir.
          </p>
        </div>
        <SectionVisibilityToggle sectionKey="popular_tabs" initialVisible={initialVisible} />
      </div>
    </div>
  )
}
