'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveDesignConsultation } from '@/app/admin/ayarlar/actions'
import { DesignConsultationData } from '@/types'
import ImageUploader from '@/components/shared/ImageUploader'
import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  initial: DesignConsultationData
  initialVisible?: boolean
}

export default function DesignConsultationManager({ initial, initialVisible = true }: Props) {
  const [data, setData] = useState<DesignConsultationData>(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveDesignConsultation(data)
      toast.success('Tasarım danışmanlığı bölümü kaydedildi')
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
          <h2 className="font-semibold">Tasarım Danışmanlığı / Showroom Bölümü</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ana sayfada gösterilen danışmanlık / showroom çağrı bloğu. Boş bırakılırsa bölüm gösterilmez.
          </p>
        </div>
        <SectionVisibilityToggle sectionKey="design_consultation" initialVisible={initialVisible} />
      </div>

      <div className="space-y-1.5">
        <Label>Başlık</Label>
        <Input
          value={data.title}
          onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
          placeholder="örn. Ücretsiz İç Mimarlık Danışmanlığı"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Açıklama Metni</Label>
        <textarea
          value={data.text}
          onChange={(e) => setData((d) => ({ ...d, text: e.target.value }))}
          placeholder="Evinizi en iyi şekilde planlamanız için uzman tasarımcılarımızdan ücretsiz destek alın..."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#222222]/30"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Buton Metni</Label>
          <Input
            value={data.cta_text}
            onChange={(e) => setData((d) => ({ ...d, cta_text: e.target.value }))}
            placeholder="Randevu Al"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Buton Linki</Label>
          <Input
            value={data.cta_href}
            onChange={(e) => setData((d) => ({ ...d, cta_href: e.target.value }))}
            placeholder="/iletisim"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Telefon</Label>
        <Input
          value={data.phone}
          onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
          placeholder="444 21 05"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Görsel</Label>
        <ImageUploader
          value={data.image_url}
          onChange={(url) => setData((d) => ({ ...d, image_url: url }))}
          storagePrefix="design-consultation-"
          aspectRatio={4 / 3}
          height={220}
        />
      </div>

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
