'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveComponentTemplate, deleteComponentTemplate } from '@/app/admin/parca-sablonlari/actions'
import { ComponentTemplate, ComponentTemplateItem } from '@/types'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'

interface Props {
  templates: ComponentTemplate[]
}

interface ItemFormState {
  name: string
  unit_price: string
  included_by_default: boolean
  min_quantity: string
  max_quantity: string
}

interface FormState {
  name: string
  items: ItemFormState[]
}

const emptyItem = (): ItemFormState => ({
  name: '',
  unit_price: '0',
  included_by_default: true,
  min_quantity: '0',
  max_quantity: '1',
})

const emptyForm = (): FormState => ({ name: '', items: [emptyItem()] })

const itemToFormState = (item: ComponentTemplateItem): ItemFormState => ({
  name: item.name,
  unit_price: String(item.unit_price),
  included_by_default: item.default_quantity > 0,
  min_quantity: String(item.min_quantity),
  max_quantity: String(item.max_quantity),
})

const toFormState = (t: ComponentTemplate): FormState => ({
  name: t.name,
  items: t.items.length > 0 ? t.items.map(itemToFormState) : [emptyItem()],
})

export default function ComponentTemplateManager({ templates }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startAdd = () => {
    setEditingId(null)
    setAdding(true)
    setForm(emptyForm())
  }

  const startEdit = (template: ComponentTemplate) => {
    setAdding(false)
    setEditingId(template.id)
    setForm(toFormState(template))
  }

  const cancel = () => {
    setAdding(false)
    setEditingId(null)
    setForm(null)
  }

  const updateItem = (index: number, patch: Partial<ItemFormState>) => {
    if (!form) return
    setForm({ ...form, items: form.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) })
  }

  const addItemRow = () => {
    if (!form) return
    setForm({ ...form, items: [...form.items, emptyItem()] })
  }

  const removeItemRow = (index: number) => {
    if (!form) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.name.trim()) {
      toast.error('Şablon adı gerekli')
      return
    }

    const items: ComponentTemplateItem[] = []
    for (const it of form.items) {
      const name = it.name.trim()
      if (!name) continue
      const minQty = Number(it.min_quantity) || 0
      const maxQty = Number(it.max_quantity) || 0
      const defaultQty = it.included_by_default ? 1 : 0
      if (maxQty < minQty) {
        toast.error(`"${name}" için maksimum adet, minimum adetten küçük olamaz`)
        return
      }
      if (defaultQty < minQty || defaultQty > maxQty) {
        toast.error(`"${name}" için "Varsayılan olarak dahil" işaretliyse parça en az 1 adet seçilebilmeli; min/maks aralığını kontrol edin`)
        return
      }
      items.push({
        name,
        unit_price: Number(it.unit_price) || 0,
        default_quantity: defaultQty,
        min_quantity: minQty,
        max_quantity: maxQty,
      })
    }

    if (items.length === 0) {
      toast.error('En az bir parça girin')
      return
    }

    setSaving(true)
    try {
      await saveComponentTemplate(editingId, { name: form.name.trim(), items })
      toast.success(editingId ? 'Şablon güncellendi' : 'Şablon eklendi')
      cancel()
      router.refresh()
    } catch (e: any) {
      toast.error('Kaydedilemedi: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return
    setDeletingId(templateId)
    try {
      await deleteComponentTemplate(templateId)
      toast.success('Şablon silindi')
      router.refresh()
    } catch (e: any) {
      toast.error('Silinemedi: ' + e.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">Parça Şablonları</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Çok parçalı ürünler (örn. &quot;Yatak Odası Takımı&quot; = Yatak + Komodin + Şifonyer) için hazır parça listeleri tanımlayın. Ürün düzenleme sayfasında bir şablon seçip &quot;Uygula&quot; dediğinizde, parçalar o ürüne toplu olarak eklenir — her ürün için tek tek yazmanıza gerek kalmaz.
          </p>
        </div>
        {!adding && !editingId && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white flex-shrink-0">
            <Plus size={14} className="mr-1" /> Şablon Ekle
          </Button>
        )}
      </div>

      {templates.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-3">Henüz şablon eklenmemiş.</p>
      )}

      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id}>
            {editingId === template.id && form ? (
              <TemplateForm
                form={form}
                setForm={setForm}
                updateItem={updateItem}
                addItemRow={addItemRow}
                removeItemRow={removeItemRow}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
              />
            ) : (
              <div className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <span className="font-medium text-sm">{template.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {template.items.map((it) => it.name).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(template)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === template.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && form && (
          <TemplateForm
            form={form}
            setForm={setForm}
            updateItem={updateItem}
            addItemRow={addItemRow}
            removeItemRow={removeItemRow}
            onSave={handleSave}
            onCancel={cancel}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

function TemplateForm({
  form,
  setForm,
  updateItem,
  addItemRow,
  removeItemRow,
  onSave,
  onCancel,
  saving,
}: {
  form: FormState
  setForm: (f: FormState) => void
  updateItem: (index: number, patch: Partial<ItemFormState>) => void
  addItemRow: () => void
  removeItemRow: (index: number) => void
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
          placeholder="örn. Yatak Odası Takımı — Standart"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Parçalar *</Label>
        <div className="space-y-3">
          {form.items.map((item, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-2.5 bg-white">
              <div className="flex items-center gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                  placeholder="örn. Komodin"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(i)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">Birim Fiyat (₺)</Label>
                  <Input type="number" min={0} value={item.unit_price} onChange={(e) => updateItem(i, { unit_price: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min. Adet</Label>
                  <Input type="number" min={0} value={item.min_quantity} onChange={(e) => updateItem(i, { min_quantity: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Maks. Adet</Label>
                  <Input type="number" min={0} value={item.max_quantity} onChange={(e) => updateItem(i, { max_quantity: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.included_by_default}
                  onChange={(e) => updateItem(i, { included_by_default: e.target.checked })}
                  className="accent-[#222222] w-4 h-4"
                />
                <span className="text-xs font-medium">Varsayılan olarak dahil (1 adet ile gelsin)</span>
              </label>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItemRow} className="text-xs text-[#222222] hover:underline mt-2">
          + Parça ekle
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Bu alanlar şablonun varsayılanlarıdır — şablonu bir ürüne uyguladıktan sonra ürünün &quot;İçeriği&quot; bölümünden parça başına fiyat/stok/aralık gibi ayrıntıları dilediğiniz gibi değiştirebilirsiniz.
      </p>

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
