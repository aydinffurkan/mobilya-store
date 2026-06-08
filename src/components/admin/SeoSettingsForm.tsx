'use client'

import { useState } from 'react'
import { saveSeoSettings } from '@/app/admin/seo/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  seo: Record<string, any>
}

export default function SeoSettingsForm({ seo }: Props) {
  const [data, setData] = useState({
    site_title: seo.site_title ?? '',
    meta_description: seo.meta_description ?? '',
    keywords: seo.keywords ?? '',
    og_image: seo.og_image ?? '',
    google_site_verification: seo.google_site_verification ?? '',
    robots_index: seo.robots_index ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSeoSettings(data)
      toast.success('SEO ayarları kaydedildi')
    } catch (e: any) {
      toast.error('Kayıt başarısız: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Genel SEO Bilgileri</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Bu bilgiler sitenizin arama motorlarında ve sosyal medyada nasıl görüneceğini belirler.
        </p>
        <div className="space-y-1.5">
          <Label>Site Başlığı</Label>
          <Input
            value={data.site_title}
            onChange={(e) => setData((p) => ({ ...p, site_title: e.target.value }))}
            placeholder="Mobilya Store – Kaliteli Mobilya"
          />
          <p className="text-xs text-muted-foreground">Tarayıcı sekmesinde ve arama sonuçlarında görünen başlık.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Meta Açıklama</Label>
          <textarea
            value={data.meta_description}
            onChange={(e) => setData((p) => ({ ...p, meta_description: e.target.value }))}
            rows={3}
            maxLength={300}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40 resize-none"
            placeholder="Türkiye'nin en güzel mobilyaları uygun fiyatlarla..."
          />
          <p className="text-xs text-muted-foreground">{data.meta_description.length}/300 karakter — arama sonuçlarında başlığın altında görünür.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Anahtar Kelimeler</Label>
          <Input
            value={data.keywords}
            onChange={(e) => setData((p) => ({ ...p, keywords: e.target.value }))}
            placeholder="mobilya, yatak odası, oturma grubu, yemek odası"
          />
          <p className="text-xs text-muted-foreground">Virgülle ayırarak yazın.</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Sosyal Medya Paylaşım Görseli</h2>
        <div className="space-y-1.5">
          <Label>Görsel URL (Open Graph)</Label>
          <Input
            value={data.og_image}
            onChange={(e) => setData((p) => ({ ...p, og_image: e.target.value }))}
            placeholder="https://.../paylasim-gorseli.jpg"
          />
          <p className="text-xs text-muted-foreground">Site bağlantısı sosyal medyada paylaşıldığında gösterilecek görsel (1200×630 önerilir).</p>
        </div>
        {data.og_image && (
          <div className="rounded-lg overflow-hidden border border-border max-w-xs">
            <img src={data.og_image} alt="OG önizleme" className="w-full aspect-[1200/630] object-cover" />
          </div>
        )}
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Arama Motoru Ayarları</h2>
        <div className="space-y-1.5">
          <Label>Google Doğrulama Kodu</Label>
          <Input
            value={data.google_site_verification}
            onChange={(e) => setData((p) => ({ ...p, google_site_verification: e.target.value }))}
            placeholder="google-site-verification içeriği"
          />
          <p className="text-xs text-muted-foreground">Google Search Console doğrulaması için verilen kod (sadece içerik kısmı).</p>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={data.robots_index}
            onChange={(e) => setData((p) => ({ ...p, robots_index: e.target.checked }))}
            className="accent-[#8B6914] w-4 h-4"
          />
          <span className="text-sm font-medium">Arama motorlarının siteyi indekslemesine izin ver</span>
        </label>
        {!data.robots_index && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠ Bu kapatıldığında site Google ve diğer arama motorlarında görünmeyecektir. Yalnızca site bakım/test aşamasındaysa kapatın.
          </p>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-[#8B6914] hover:bg-[#7a5c12] text-white">
        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
      </Button>
    </div>
  )
}
