'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveSpecTemplate, deleteSpecTemplate } from '@/app/admin/sablonlar/actions'
import { SpecTemplate, ProductSpec } from '@/types'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'

interface Props {
  templates: SpecTemplate[]
}

interface FormState {
  name: string
  items: ProductSpec[]
}

const emptyItem = (): ProductSpec => ({ key: '', value: '' })
const emptyForm = (): FormState => ({ name: '', items: [emptyItem()] })
const toFormState = (t: SpecTemplate): FormState => ({
  name: t.name,
  items: t.items.length > 0 ? t.items.map((i) => ({ ...i })) : [emptyItem()],
})

export default function SpecTemplateManager({ templates }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startAdd = () => { setEditingId(null); setAdding(true); setForm(emptyForm()) }
  const startEdit = (t: SpecTemplate) => { setAdding(false); setEditingId(t.id); setForm(toFormState(t)) }
  const cancel = () => { setAdding(false); setEditingId(null); setForm(null) }

  const updateItem = (i: number, field: keyof ProductSpec, val: string) => {
    if (!form) return
    setForm({ ...form, items: form.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) })
  }
  const addRow = () => form && setForm({ ...form, items: [...form.items, emptyItem()] })
  const removeRow = (i: number) => form && setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })

  const handleSave = async () => {
    if (!form) return
    if (!form.name.trim()) { toast.error('Şablon adı gerekli'); return }
    const items = form.items.filter((it) => it.key.trim())
    if (items.length === 0) { toast.error('En az bir özellik girin'); return }
    setSaving(true)
    try {
      await saveSpecTemplate(editingId, { name: form.name.trim(), items })
      toast.success(editingId ? 'Şablon güncellendi' : 'Şablon eklendi')
      cancel()
      router.refresh()
    } catch (e: unknown) {
      toast.error('Kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return
    setDeletingId(id)
    try {
      await deleteSpecTemplate(id)
      toast.success('Şablon silindi')
      router.refresh()
    } catch (e: unknown) {
      toast.error('Silinemedi: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Ürün Özellik Şablonları</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Benzer ürünlerin teknik özellik tablolarını şablon olarak kaydedin. Ürün düzenleme sayfasında "Şablon Uygula" ile tek tıkla doldurun.
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
              <SpecForm form={form} setForm={setForm} updateItem={updateItem} addRow={addRow}
                removeRow={removeRow} onSave={handleSave} onCancel={cancel} saving={saving} />
            ) : (
              <div className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <span className="font-medium text-sm">{t.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {t.items.map((it) => it.key).filter(Boolean).join(' · ')}
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
          <SpecForm form={form} setForm={setForm} updateItem={updateItem} addRow={addRow}
            removeRow={removeRow} onSave={handleSave} onCancel={cancel} saving={saving} />
        )}
      </div>
    </div>
  )
}

function SpecForm({ form, setForm, updateItem, addRow, removeRow, onSave, onCancel, saving }: {
  form: FormState
  setForm: (f: FormState) => void
  updateItem: (i: number, field: keyof ProductSpec, val: string) => void
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
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="örn. Yatak Odası Takımı — Teknik Özellikler"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Özellikler *</Label>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-2/5">Özellik Adı</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Değer</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {form.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-1.5 px-2">
                    <Input value={item.key} onChange={(e) => updateItem(i, 'key', e.target.value)}
                      placeholder="Yatak Ölçüsü" className="h-8 text-sm" />
                  </td>
                  <td className="py-1.5 px-2">
                    <Input value={item.value} onChange={(e) => updateItem(i, 'value', e.target.value)}
                      placeholder="160x200 cm" className="h-8 text-sm" />
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    <button type="button" onClick={() => removeRow(i)}
                      className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addRow} className="text-xs text-[#222222] hover:underline mt-1">
          + Satır ekle
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