'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveHeroSlider } from '@/app/admin/ayarlar/actions'
import { HeroSlide } from '@/types'
import { Pencil, Trash2, Loader2, Plus, ArrowUp, ArrowDown } from 'lucide-react'
import HotspotEditor from '@/components/shared/HotspotEditor'
import ImageUploader from '@/components/shared/ImageUploader'
import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  slides: HeroSlide[]
  initialVisible?: boolean
}

const emptySlide = (): HeroSlide => ({
  image_url: null,
  title: '',
  subtitle: '',
  desc: '',
  cta_text: '',
  cta_href: '',
  hotspots: [],
})

export default function SliderManager({ slides: initialSlides, initialVisible = true }: Props) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<HeroSlide | null>(null)
  const [saving, setSaving] = useState(false)

  const persist = async (next: HeroSlide[], successMessage: string) => {
    setSaving(true)
    try {
      await saveHeroSlider(next)
      setSlides(next)
      toast.success(successMessage)
      setAdding(false)
      setEditingIndex(null)
      setForm(null)
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  const startAdd = () => {
    setEditingIndex(null)
    setAdding(true)
    setForm(emptySlide())
  }

  const startEdit = (index: number) => {
    setAdding(false)
    setEditingIndex(index)
    setForm({ hotspots: [], ...slides[index] })
  }

  const cancel = () => {
    setAdding(false)
    setEditingIndex(null)
    setForm(null)
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.title.trim()) {
      toast.error('Başlık gerekli')
      return
    }
    const next = editingIndex !== null
      ? slides.map((s, i) => (i === editingIndex ? form : s))
      : [...slides, form]
    await persist(next, editingIndex !== null ? 'Slayt güncellendi' : 'Slayt eklendi')
  }

  const handleDelete = async (index: number) => {
    if (!confirm('Bu slaytı silmek istediğinize emin misiniz?')) return
    await persist(slides.filter((_, i) => i !== index), 'Slayt silindi')
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= slides.length) return
    const next = [...slides]
    ;[next[index], next[target]] = [next[target], next[index]]
    await persist(next, 'Sıralama güncellendi')
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Ana Sayfa Slider</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ziyaretçiyi anasayfada karşılayan, otomatik geçişli slayt galerisi. Her slayta ürün noktaları ekleyebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SectionVisibilityToggle sectionKey="slider" initialVisible={initialVisible} />
          {!adding && editingIndex === null && (
            <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
              <Plus size={14} className="mr-1" /> Slayt Ekle
            </Button>
          )}
        </div>
      </div>

      {slides.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-2">Henüz slayt eklenmemiş.</p>
      )}

      <div className="space-y-2">
        {slides.map((slide, index) => (
          <div key={index}>
            {editingIndex === index && form ? (
              <SlideForm
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={cancel}
                onImageChange={(url) => setForm({ ...form, image_url: url })}
                saving={saving}
              />
            ) : (
              <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3">
                <div className="w-16 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {slide.image_url ? (
                    <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">Görsel yok</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{slide.title || '(Başlıksız)'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {slide.subtitle}
                    {(slide.hotspots?.length ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-[#222222]">
                        <Plus size={10} />{slide.hotspots!.length} ürün noktası
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === slides.length - 1 || saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={() => startEdit(index)} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(index)} disabled={saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && form && (
          <SlideForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={cancel}
            onImageChange={(url) => setForm({ ...form, image_url: url })}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

function SlideForm({
  form,
  setForm,
  onSave,
  onCancel,
  onImageChange,
  saving,
}: {
  form: HeroSlide
  setForm: (f: HeroSlide) => void
  onSave: () => void
  onCancel: () => void
  onImageChange: (url: string | null) => void
  saving: boolean
}) {
  return (
    <div className="border border-[#222222]/40 rounded-xl p-4 space-y-4 bg-[#222222]/5">
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-2">
          <Label>Görsel</Label>
          <span className="text-[11px] text-muted-foreground">Önerilen: <strong>1920 × 600 px</strong> · 16:5 oran · tam sayfa banner</span>
        </div>
        <ImageUploader
          value={form.image_url}
          onChange={onImageChange}
          storagePrefix="slider-"
          aspectRatio={16 / 5}
          height={130}
        />
      </div>

      {/* Başlık / Etiket */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Üst Etiket</Label>
          <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="örn. Yatak Odası Koleksiyonları" />
        </div>
        <div className="space-y-1.5">
          <Label>Başlık *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="örn. Ulaşılabilir Lüks" />
        </div>
      </div>

      {/* Açıklama */}
      <div className="space-y-1.5">
        <Label>Açıklama</Label>
        <textarea
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none bg-background"
        />
      </div>

      {/* CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Buton Metni</Label>
          <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="örn. Koleksiyonu Gör" />
        </div>
        <div className="space-y-1.5">
          <Label>Buton Linki</Label>
          <Input value={form.cta_href} onChange={(e) => setForm({ ...form, cta_href: e.target.value })} placeholder="/kategori/yatak-odasi" />
        </div>
      </div>

      {/* Ürün Noktaları */}
      {form.image_url && (
        <HotspotEditor
          imageUrl={form.image_url}
          hotspots={form.hotspots ?? []}
          onChange={(hotspots) => setForm({ ...form, hotspots })}
        />
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={saving} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
      </div>
    </div>
  )
}
