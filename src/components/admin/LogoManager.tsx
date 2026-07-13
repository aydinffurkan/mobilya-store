'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveLogoSettings } from '@/app/admin/ayarlar/actions'
import { LogoData } from '@/types'
import ImageUploader from '@/components/shared/ImageUploader'

interface Props {
  initial: LogoData
}

export default function LogoManager({ initial }: Props) {
  const [data, setData] = useState<LogoData>(initial)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveLogoSettings(data)
      toast.success('Logo kaydedildi')
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Logo</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Header'da görünecek site logosu. Yüklenmezse varsayılan metin logo kullanılır.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Logo Görseli</Label>
        <ImageUploader
          value={data.image_url}
          onChange={(url) => setData((d) => ({ ...d, image_url: url }))}
          storagePrefix="logo-"
          height={96}
          placeholder="Logo Yükle (PNG/SVG önerilen)"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Alt Metin (SEO)</Label>
        <Input
          value={data.alt}
          onChange={(e) => setData((d) => ({ ...d, alt: e.target.value }))}
          placeholder="örn. Messa Home Logo"
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