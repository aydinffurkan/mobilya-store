'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveAboutSection } from '@/app/admin/ayarlar/actions'
import { AboutSectionData } from '@/types'
import ImageUploader from '@/components/shared/ImageUploader'
import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  initial: AboutSectionData
  initialVisible?: boolean
}

export default function AboutSectionManager({ initial, initialVisible = true }: Props) {
  const [data, setData] = useState<AboutSectionData>(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAboutSection(data)
      toast.success('Hakkımızda bölümü kaydedildi')
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
          <h2 className="font-semibold">Hakkımızda Bölümü</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ana sayfada firma hikayesini anlatan bölüm
          </p>
        </div>
        <SectionVisibilityToggle sectionKey="about_section" initialVisible={initialVisible} />
      </div>

      <div className="space-y-1.5">
        <Label>Başlık</Label>
        <Input
          value={data.title}
          onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
          placeholder="örn. 20 Yıldır Güvenilir Mobilya"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Açıklama Metni</Label>
        <textarea
          value={data.text}
          onChange={(e) => setData((d) => ({ ...d, text: e.target.value }))}
          placeholder="Firmanız hakkında kısa bir tanıtım yazısı..."
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#222222]/30"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Görsel</Label>
        <ImageUploader
          value={data.image_url}
          onChange={(url) => setData((d) => ({ ...d, image_url: url }))}
          storagePrefix="about-"
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