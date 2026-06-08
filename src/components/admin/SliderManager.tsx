'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { saveHeroSlider } from '@/app/admin/ayarlar/actions'
import { HeroSlide } from '@/types'
import { ImagePlus, Pencil, Trash2, X, Loader2, Plus, ArrowUp, ArrowDown } from 'lucide-react'

interface Props {
  slides: HeroSlide[]
}

const emptySlide = (): HeroSlide => ({
  image_url: null,
  title: '',
  subtitle: '',
  desc: '',
  cta_text: '',
  cta_href: '',
})

export default function SliderManager({ slides: initialSlides }: Props) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<HeroSlide | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const persist = async (next: HeroSlide[], successMessage: string) => {
    setSaving(true)
    try {
      await saveHeroSlider(next)
      setSlides(next)
      toast.success(successMessage)
      setAdding(false)
      setEditingIndex(null)
      setForm(null)
    } catch (e: any) {
      toast.error('Kaydedilemedi: ' + e.message)
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
    setForm({ ...slides[index] })
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !form) return

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `slider-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) {
      toast.error('Görsel yüklenemedi')
    } else {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
      setForm({ ...form, image_url: urlData.publicUrl })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = async () => {
    if (!form?.image_url) return
    const supabase = createClient()
    const path = form.image_url.split('/product-images/')[1]
    if (path) await supabase.storage.from('product-images').remove([path])
    setForm({ ...form, image_url: null })
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Ana Sayfa Slider</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ziyaretçiyi anasayfada karşılayan, otomatik geçişli slayt galerisi. En az bir slayt eklemeniz önerilir.
          </p>
        </div>
        {!adding && editingIndex === null && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#8B6914] hover:bg-[#7a5c12] text-white flex-shrink-0">
            <Plus size={14} className="mr-1" /> Slayt Ekle
          </Button>
        )}
      </div>

      {slides.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-2">Henüz slayt eklenmemiş — varsayılan tek slaytlı görünüm kullanılacak.</p>
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
                onImageUpload={handleImageUpload}
                onImageRemove={removeImage}
                fileInputRef={fileInputRef}
                uploading={uploading}
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
                  <p className="text-xs text-muted-foreground truncate">{slide.subtitle}</p>
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
            onImageUpload={handleImageUpload}
            onImageRemove={removeImage}
            fileInputRef={fileInputRef}
            uploading={uploading}
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
  onImageUpload,
  onImageRemove,
  fileInputRef,
  uploading,
  saving,
}: {
  form: HeroSlide
  setForm: (f: HeroSlide) => void
  onSave: () => void
  onCancel: () => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageRemove: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  uploading: boolean
  saving: boolean
}) {
  return (
    <div className="border border-[#8B6914]/40 rounded-xl p-4 space-y-3 bg-[#8B6914]/5">
      <div className="space-y-1.5">
        <Label>Görsel</Label>
        {form.image_url ? (
          <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border group">
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-[#8B6914] transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-[#8B6914]"
          >
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
            <span className="text-xs">{uploading ? 'Yükleniyor...' : 'Görsel Yükle'}</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Üst Etiket (Alt Başlık)</Label>
          <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="örn. Yatak Odası Koleksiyonları" />
        </div>
        <div className="space-y-1.5">
          <Label>Başlık *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="örn. Ulaşılabilir Lüks" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Açıklama</Label>
        <textarea
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6914]/40 resize-none bg-background"
        />
      </div>

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

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={saving} className="bg-[#8B6914] hover:bg-[#7a5c12] text-white">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
      </div>
    </div>
  )
}
