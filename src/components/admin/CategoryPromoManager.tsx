'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { saveCategoryPromoCards } from '@/app/admin/kategoriler/actions'
import { CategoryPromoCard } from '@/types'
import { ImagePlus, Pencil, Trash2, X, Loader2, Plus, ArrowUp, ArrowDown } from 'lucide-react'

interface Props {
  categoryId: string
  cards: CategoryPromoCard[]
}

const emptyCard = (): CategoryPromoCard => ({
  image_url: null,
  title: '',
  href: '',
})

export default function CategoryPromoManager({ categoryId, cards: initialCards }: Props) {
  const [cards, setCards] = useState<CategoryPromoCard[]>(initialCards)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<CategoryPromoCard | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const persist = async (next: CategoryPromoCard[], successMessage: string) => {
    setSaving(true)
    try {
      await saveCategoryPromoCards(categoryId, next)
      setCards(next)
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
    setForm(emptyCard())
  }

  const startEdit = (index: number) => {
    setAdding(false)
    setEditingIndex(index)
    setForm({ ...cards[index] })
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
      ? cards.map((c, i) => (i === editingIndex ? form : c))
      : [...cards, form]
    await persist(next, editingIndex !== null ? 'Kart güncellendi' : 'Kart eklendi')
  }

  const handleDelete = async (index: number) => {
    if (!confirm('Bu kartı silmek istediğinize emin misiniz?')) return
    await persist(cards.filter((_, i) => i !== index), 'Kart silindi')
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= cards.length) return
    const next = [...cards]
    ;[next[index], next[target]] = [next[target], next[index]]
    await persist(next, 'Sıralama güncellendi')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !form) return

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `category-promo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
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
          <h2 className="font-semibold">Mega Menü Promosyon Kartları</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bu kategorinin üzerine gelindiğinde menüde alt kategorilerin yanında gösterilen yuvarlak görselli kartlar (örn. "Çok Satan Koltuklar").
          </p>
        </div>
        {!adding && editingIndex === null && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#8B6914] hover:bg-[#7a5c12] text-white flex-shrink-0">
            <Plus size={14} className="mr-1" /> Kart Ekle
          </Button>
        )}
      </div>

      {cards.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-2">Henüz kart eklenmemiş — menüde alt kategoriler yalnız başına gösterilecek.</p>
      )}

      <div className="space-y-2">
        {cards.map((card, index) => (
          <div key={index}>
            {editingIndex === index && form ? (
              <PromoCardForm
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
                <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 overflow-hidden border border-border">
                  {card.image_url ? (
                    <img src={card.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[9px]">Görsel yok</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{card.title || '(Başlıksız)'}</p>
                  <p className="text-xs text-muted-foreground truncate">{card.href || '—'}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === cards.length - 1 || saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30">
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
          <PromoCardForm
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

function PromoCardForm({
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
  form: CategoryPromoCard
  setForm: (f: CategoryPromoCard) => void
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
      <div className="flex items-start gap-4">
        <div className="space-y-1.5 flex-shrink-0">
          <Label>Görsel</Label>
          {form.image_url ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border group">
              <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-full border-2 border-dashed border-border hover:border-[#8B6914] transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-[#8B6914]"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
        </div>

        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label>Başlık *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="örn. Çok Satan Koltuklar" />
          </div>
          <div className="space-y-1.5">
            <Label>Link</Label>
            <Input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/urunler?siralama=cok-satan" />
          </div>
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
