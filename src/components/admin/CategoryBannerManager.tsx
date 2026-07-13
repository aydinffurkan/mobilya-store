'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveCategoryBanners } from '@/app/admin/ayarlar/actions'
import { CategoryBanner } from '@/types'
import { Pencil, Trash2, Loader2, Plus, ArrowUp, ArrowDown } from 'lucide-react'
import ImageUploader from '@/components/shared/ImageUploader'
import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  items: CategoryBanner[]
  initialVisible?: boolean
}

const emptyItem = (): CategoryBanner => ({
  title: '',
  subtitle: '',
  href: '',
  image_url: null,
  cta: 'Hemen Keşfet',
})

export default function CategoryBannerManager({ items: initialItems, initialVisible = true }: Props) {
  const [items, setItems]             = useState<CategoryBanner[]>(initialItems)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding]           = useState(false)
  const [form, setForm]               = useState<CategoryBanner | null>(null)
  const [saving, setSaving]           = useState(false)

  const persist = async (next: CategoryBanner[], msg: string) => {
    setSaving(true)
    try {
      await saveCategoryBanners(next)
      setItems(next)
      toast.success(msg)
      setAdding(false)
      setEditingIndex(null)
      setForm(null)
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  const startAdd  = () => { setEditingIndex(null); setAdding(true);  setForm(emptyItem()) }
  const startEdit = (i: number) => { setAdding(false); setEditingIndex(i); setForm({ ...items[i] }) }
  const cancel    = () => { setAdding(false); setEditingIndex(null); setForm(null) }

  const handleSave = async () => {
    if (!form) return
    if (!form.title.trim()) { toast.error('Başlık gerekli'); return }
    const next = editingIndex !== null
      ? items.map((it, i) => (i === editingIndex ? form : it))
      : [...items, form]
    await persist(next, editingIndex !== null ? 'Banner güncellendi' : 'Banner eklendi')
  }

  const handleDelete = async (i: number) => {
    if (!confirm('Bu banner\'ı kaldırmak istediğinize emin misiniz?')) return
    await persist(items.filter((_, idx) => idx !== i), 'Banner kaldırıldı')
  }

  const move = async (i: number, dir: -1 | 1) => {
    const t = i + dir
    if (t < 0 || t >= items.length) return
    const next = [...items];
    [next[i], next[t]] = [next[t], next[i]]
    await persist(next, 'Sıralama güncellendi')
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Kategori Banner Grid</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Anasayfadaki asimetrik banner bölümü. İlk 4 öğe gösterilir — sol büyük, orta ikili, sağ büyük.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SectionVisibilityToggle sectionKey="category_banners" initialVisible={initialVisible} />
          {!adding && editingIndex === null && (
            <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
              <Plus size={14} className="mr-1" /> Banner Ekle
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-2">
          Henüz banner eklenmemiş — eklenene kadar varsayılan renkler gösterilir.
        </p>
      )}

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i}>
            {editingIndex === i && form ? (
              <BannerForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} saving={saving} />
            ) : (
              <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3">
                <div className="w-16 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-200 flex items-center justify-center text-[10px] text-stone-500">Görsel yok</div>
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.title || '(İsimsiz)'}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle} · {item.href || '— link yok —'}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1 || saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={() => startEdit(i)} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(i)} disabled={saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && form && (
          <BannerForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} saving={saving} />
        )}
      </div>
    </div>
  )
}

function BannerForm({
  form, setForm, onSave, onCancel, saving,
}: {
  form: CategoryBanner
  setForm: (f: CategoryBanner) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="border border-[#222222]/40 rounded-xl p-4 space-y-3 bg-[#222222]/5">
      <div className="space-y-1.5">
        <Label>Banner Görseli</Label>
        <ImageUploader
          value={form.image_url}
          onChange={(url) => setForm({ ...form, image_url: url })}
          storagePrefix="category-banner-"
          aspectRatio={16 / 9}
          height={160}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Başlık *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="örn. Dolaplar" />
        </div>
        <div className="space-y-1.5">
          <Label>Alt Başlık</Label>
          <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="örn. Şık & Fonksiyonel" />
        </div>
        <div className="space-y-1.5">
          <Label>Link</Label>
          <Input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/kategori/dolaplar" />
        </div>
        <div className="space-y-1.5">
          <Label>Buton Metni</Label>
          <Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Hemen Keşfet" />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={saving} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {saving ? <><Loader2 size={13} className="animate-spin mr-1.5" />Kaydediliyor...</> : 'Kaydet'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
      </div>
    </div>
  )
}