'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveCategoryShowcase } from '@/app/admin/ayarlar/actions'
import { CategoryPromoCard } from '@/types'
import { Pencil, Trash2, Loader2, Plus, ArrowUp, ArrowDown } from 'lucide-react'
import ImageUploader from '@/components/shared/ImageUploader'
import SectionVisibilityToggle from '@/components/admin/SectionVisibilityToggle'

interface Props {
  items: CategoryPromoCard[]
  initialVisible?: boolean
}

const emptyItem = (): CategoryPromoCard => ({ image_url: null, title: '', href: '' })

export default function CategoryShowcaseManager({ items: initialItems, initialVisible = true }: Props) {
  const [items, setItems] = useState<CategoryPromoCard[]>(initialItems)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<CategoryPromoCard | null>(null)
  const [saving, setSaving] = useState(false)

  const persist = async (next: CategoryPromoCard[], successMessage: string) => {
    setSaving(true)
    try {
      await saveCategoryShowcase(next)
      setItems(next)
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
    setForm(emptyItem())
  }

  const startEdit = (index: number) => {
    setAdding(false)
    setEditingIndex(index)
    setForm({ ...items[index] })
  }

  const cancel = () => {
    setAdding(false)
    setEditingIndex(null)
    setForm(null)
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.title.trim()) {
      toast.error('Kategori adı gerekli')
      return
    }
    const next = editingIndex !== null
      ? items.map((it, i) => (i === editingIndex ? form : it))
      : [...items, form]
    await persist(next, editingIndex !== null ? 'Kategori güncellendi' : 'Kategori eklendi')
  }

  const handleDelete = async (index: number) => {
    if (!confirm('Bu kategoriyi listeden kaldırmak istediğinize emin misiniz?')) return
    await persist(items.filter((_, i) => i !== index), 'Kategori kaldırıldı')
  }

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    await persist(next, 'Sıralama güncellendi')
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">En Gözde Kategorilerimiz</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Anasayfadaki "En Gözde Kategorilerimiz" bölümünde gösterilecek görsel, isim ve linkleri buradan yönetin. Düzgün bir grid görünümü için 10 öğe önerilir.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SectionVisibilityToggle sectionKey="category_showcase" initialVisible={initialVisible} />
          {!adding && editingIndex === null && (
            <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
              <Plus size={14} className="mr-1" /> Kategori Ekle
            </Button>
          )}
        </div>
      </div>

      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-2">Henüz öğe eklenmemiş — eklenene kadar bu bölüm anasayfada görünmez.</p>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index}>
            {editingIndex === index && form ? (
              <ShowcaseItemForm
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
              />
            ) : (
              <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3">
                <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-muted-foreground text-[10px]">Görsel yok</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.title || '(İsimsiz)'}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.href || '— link yok —'}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1 || saving} className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30">
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
          <ShowcaseItemForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={cancel}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

function ShowcaseItemForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: CategoryPromoCard
  setForm: (f: CategoryPromoCard) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="border border-[#222222]/40 rounded-xl p-4 space-y-3 bg-[#222222]/5">
      <div className="space-y-1.5">
        <Label>Görsel</Label>
        <ImageUploader
          value={form.image_url}
          onChange={(url) => setForm({ ...form, image_url: url })}
          storagePrefix="showcase-"
          aspectRatio={1}
          height={128}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kategori Adı *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="örn. Yatak Odası" />
        </div>
        <div className="space-y-1.5">
          <Label>Link</Label>
          <Input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/kategori/yatak-odasi" />
        </div>
      </div>

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