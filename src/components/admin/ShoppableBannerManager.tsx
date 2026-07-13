'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveShoppableBanner, ShoppableBannerData } from '@/app/admin/ayarlar/actions'
import HotspotEditor from '@/components/shared/HotspotEditor'
import ImageUploader from '@/components/shared/ImageUploader'
import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  initial: ShoppableBannerData
  initialVisible?: boolean
}

export default function ShoppableBannerManager({ initial, initialVisible = true }: Props) {
  const [data, setData] = useState<ShoppableBannerData>(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveShoppableBanner(data)
      toast.success('Tıklanabilir görsel kaydedildi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Tıklanabilir Görsel Bölümü</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ana sayfada ayrı bir bölüm olarak görünen, üzerinde ürün noktaları olan büyük görsel.
          </p>
        </div>
        <SectionVisibilityToggle sectionKey="shoppable_banner" initialVisible={initialVisible} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Bölüm Başlığı</Label>
          <Input
            value={data.title}
            onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
            placeholder="örn. Oturma Odası Koleksiyonu"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Alt Başlık</Label>
          <Input
            value={data.subtitle}
            onChange={(e) => setData((d) => ({ ...d, subtitle: e.target.value }))}
            placeholder="örn. Ürüne tıkla, detayları gör"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Görsel</Label>
        <ImageUploader
          value={data.image_url}
          onChange={(url) => setData((d) => ({ ...d, image_url: url, hotspots: url ? d.hotspots : [] }))}
          storagePrefix="shoppable-"
          aspectRatio={16 / 9}
          height={220}
        />
      </div>

      {data.image_url && (
        <HotspotEditor
          imageUrl={data.image_url}
          hotspots={data.hotspots}
          onChange={(hotspots) => setData((d) => ({ ...d, hotspots }))}
        />
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white"
      >
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  )
}