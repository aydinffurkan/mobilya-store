'use client'

import { useState } from 'react'
import { saveSiteSettings } from '@/app/admin/ayarlar/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  hero: Record<string, string>
  contact: Record<string, string>
}

export default function SiteSettingsForm({ hero, contact }: Props) {
  const [heroData, setHeroData] = useState({
    title: hero.title ?? '',
    subtitle: hero.subtitle ?? '',
    desc: hero.desc ?? '',
    cta_text: hero.cta_text ?? '',
    cta_href: hero.cta_href ?? '',
    badge_1: hero.badge_1 ?? '',
    badge_2: hero.badge_2 ?? '',
    badge_3: hero.badge_3 ?? '',
  })
  const [contactData, setContactData] = useState({
    phone: contact.phone ?? '',
    email: contact.email ?? '',
    address: contact.address ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSiteSettings(heroData, contactData)
      toast.success('Ayarlar kaydedildi')
    } catch (e: any) {
      toast.error('Kayıt başarısız: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Hero */}
      <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Ana Sayfa Hero Bölümü</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Başlık</Label>
            <Input value={heroData.title} onChange={e => setHeroData(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Alt Başlık</Label>
            <Input value={heroData.subtitle} onChange={e => setHeroData(p => ({ ...p, subtitle: e.target.value }))} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Açıklama</Label>
            <textarea
              value={heroData.desc}
              onChange={e => setHeroData(p => ({ ...p, desc: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Buton Metni</Label>
            <Input value={heroData.cta_text} onChange={e => setHeroData(p => ({ ...p, cta_text: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Buton Linki</Label>
            <Input value={heroData.cta_href} onChange={e => setHeroData(p => ({ ...p, cta_href: e.target.value }))} placeholder="/kategori/yatak-odasi" />
          </div>
          <div className="space-y-1.5">
            <Label>Rozet 1</Label>
            <Input value={heroData.badge_1} onChange={e => setHeroData(p => ({ ...p, badge_1: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Rozet 2</Label>
            <Input value={heroData.badge_2} onChange={e => setHeroData(p => ({ ...p, badge_2: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Rozet 3</Label>
            <Input value={heroData.badge_3} onChange={e => setHeroData(p => ({ ...p, badge_3: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">İletişim Bilgileri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input value={contactData.phone} onChange={e => setContactData(p => ({ ...p, phone: e.target.value }))} placeholder="444 21 05" />
          </div>
          <div className="space-y-1.5">
            <Label>E-posta</Label>
            <Input value={contactData.email} onChange={e => setContactData(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Adres</Label>
            <Input value={contactData.address} onChange={e => setContactData(p => ({ ...p, address: e.target.value }))} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
      </Button>
    </div>
  )
}
