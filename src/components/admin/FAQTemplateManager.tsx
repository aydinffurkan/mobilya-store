'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveFAQTemplate, deleteFAQTemplate } from '@/app/admin/sablonlar/actions'
import { FAQTemplate, FAQItem } from '@/types'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'

interface Props { templates: FAQTemplate[] }
interface FormState { name: string; items: FAQItem[] }

const emptyItem  = (): FAQItem    => ({ q: '', a: '' })
const emptyForm  = (): FormState  => ({ name: '', items: [emptyItem()] })
const toForm     = (t: FAQTemplate): FormState => ({
  name: t.name,
  items: t.items.length > 0 ? t.items.map((i) => ({ ...i })) : [emptyItem()],
})

export default function FAQTemplateManager({ templates }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding,    setAdding]    = useState(false)
  const [form,      setForm]      = useState<FormState | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [deletingId,setDeletingId]= useState<string | null>(null)

  const startAdd  = () => { setEditingId(null); setAdding(true); setForm(emptyForm()) }
  const startEdit = (t: FAQTemplate) => { setAdding(false); setEditingId(t.id); setForm(toForm(t)) }
  const cancel    = () => { setAdding(false); setEditingId(null); setForm(null) }

  const updateItem = (i: number, field: keyof FAQItem, val: string) => {
    if (!form) return
    setForm({ ...form, items: form.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) })
  }
  const addRow    = () => form && setForm({ ...form, items: [...form.items, emptyItem()] })
  const removeRow = (i: number) => form && setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })

  const handleSave = async () => {
    if (!form) return
    if (!form.name.trim()) { toast.error('Şablon adı gerekli'); return }
    const items = form.items.filter((it) => it.q.trim())
    if (items.length === 0) { toast.error('En az bir soru girin'); return }
    setSaving(true)
    try {
      await saveFAQTemplate(editingId, { name: form.name.trim(), items })
      toast.success(editingId ? 'Şablon güncellendi' : 'Şablon eklendi')
      cancel(); router.refresh()
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return
    setDeletingId(id)
    try {
      await deleteFAQTemplate(id)
      toast.success('Şablon silindi'); router.refresh()
    } catch (e: unknown) {
      toast.error('Silinemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally { setDeletingId(null) }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">SSS Şablonları</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sıkça sorulan soru–cevap setlerini şablon olarak kaydedin, ürünlere tek tıkla uygulayın.
          </p>
        </div>
        {!adding && !editingId && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white flex-shrink-0">
            <Plus size={14} className="mr-1" /> Şablon Ekle
          </Button>
        )}
      </div>

      {templates.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-2">Henüz şablon eklenmemiş.</p>
      )}

      <div className="space-y-2">
        {templates.map((t) => (
          <div key={t.id}>
            {editingId === t.id && form ? (
              <FAQForm form={form} setForm={setForm} updateItem={updateItem} addRow={addRow}
                removeRow={removeRow} onSave={handleSave} onCancel={cancel} saving={saving} />
            ) : (
              <div className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <span className="font-medium text-sm">{t.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {t.items.map((it) => it.q).filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => startEdit(t)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    {deletingId === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {adding && form && (
          <FAQForm form={form} setForm={setForm} updateItem={updateItem} addRow={addRow}
            removeRow={removeRow} onSave={handleSave} onCancel={cancel} saving={saving} />
        )}
      </div>
    </div>
  )
}

function FAQForm({ form, setForm, updateItem, addRow, removeRow, onSave, onCancel, saving }: {
  form: FormState
  setForm: (f: FormState) => void
  updateItem: (i: number, field: keyof FAQItem, val: string) => void
  addRow: () => void
  removeRow: (i: number) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="border border-[#222222]/40 rounded-xl p-4 space-y-4 bg-[#222222]/5">
      <div className="space-y-1.5">
        <Label>Şablon Adı *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="örn. Genel SSS — Mobilya" />
      </div>

      <div className="space-y-2">
        <Label>Sorular ve Cevaplar *</Label>
        {form.items.map((item, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2 bg-white">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input value={item.q} onChange={(e) => updateItem(i, 'q', e.target.value)}
                  placeholder="Soru..." className="h-8 text-sm" />
                <textarea
                  value={item.a}
                  onChange={(e) => updateItem(i, 'a', e.target.value)}
                  placeholder="Cevap..."
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none"
                />
              </div>
              <button type="button" onClick={() => removeRow(i)}
                className="mt-1 inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive flex-shrink-0">
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addRow} className="text-xs text-[#222222] hover:underline">
          + Soru ekle
        </button>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={saving} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {saving ? <><Loader2 size={13} className="animate-spin mr-1.5" />Kaydediliyor...</> : 'Kaydet'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>Vazgeç</Button>
      </div>
    </div>
  )
}