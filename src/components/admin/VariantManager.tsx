'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveVariant, deleteVariant } from '@/app/admin/urunler/actions'
import { ProductVariant, VariantTemplate } from '@/types'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'

interface Props {
  productId: string
  variants: ProductVariant[]
  templates: VariantTemplate[]
}

interface AttrRow {
  key: string
  value: string
}

interface FormState {
  name: string
  attrs: AttrRow[]
  price: string
  sale_price: string
  stock: string
  sort_order: string
  is_active: boolean
}

const emptyForm = (sortOrder: number): FormState => ({
  name: '',
  attrs: [{ key: '', value: '' }],
  price: '',
  sale_price: '',
  stock: '0',
  sort_order: String(sortOrder),
  is_active: true,
})

const toFormState = (v: ProductVariant): FormState => ({
  name: v.name,
  attrs: Object.entries(v.attributes ?? {}).length > 0
    ? Object.entries(v.attributes).map(([key, value]) => ({ key, value }))
    : [{ key: '', value: '' }],
  price: v.price != null ? String(v.price) : '',
  sale_price: v.sale_price != null ? String(v.sale_price) : '',
  stock: String(v.stock),
  sort_order: String(v.sort_order),
  is_active: v.is_active,
})

export default function VariantManager({ productId, variants, templates }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startAdd = () => {
    setEditingId(null)
    setAdding(true)
    setForm(emptyForm(variants.length))
  }

  const startEdit = (variant: ProductVariant) => {
    setAdding(false)
    setEditingId(variant.id)
    setForm(toFormState(variant))
  }

  const cancel = () => {
    setAdding(false)
    setEditingId(null)
    setForm(null)
  }

  const updateAttr = (index: number, field: 'key' | 'value', value: string) => {
    if (!form) return
    setForm({
      ...form,
      attrs: form.attrs.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    })
  }

  const addAttrRow = () => {
    if (!form) return
    setForm({ ...form, attrs: [...form.attrs, { key: '', value: '' }] })
  }

  const removeAttrRow = (index: number) => {
    if (!form) return
    setForm({ ...form, attrs: form.attrs.filter((_, i) => i !== index) })
  }

  const applyTemplateOption = (templateName: string, option: string) => {
    if (!form) return
    const emptyIndex = form.attrs.findIndex((a) => !a.key.trim() && !a.value.trim())
    const row = { key: templateName, value: option }
    if (emptyIndex !== -1) {
      setForm({ ...form, attrs: form.attrs.map((a, i) => (i === emptyIndex ? row : a)) })
    } else {
      setForm({ ...form, attrs: [...form.attrs, row] })
    }
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.name.trim()) {
      toast.error('Varyant adı gerekli')
      return
    }

    const attributes: Record<string, string> = {}
    for (const { key, value } of form.attrs) {
      if (key.trim()) attributes[key.trim()] = value.trim()
    }

    setSaving(true)
    try {
      await saveVariant(productId, editingId, {
        name: form.name.trim(),
        attributes,
        price: form.price.trim() ? Number(form.price) : null,
        sale_price: form.sale_price.trim() ? Number(form.sale_price) : null,
        stock: Number(form.stock) || 0,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      })
      toast.success(editingId ? 'Varyant güncellendi' : 'Varyant eklendi')
      cancel()
      router.refresh()
    } catch (e: any) {
      toast.error('Kaydedilemedi: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (variantId: string) => {
    if (!confirm('Bu varyantı silmek istediğinize emin misiniz?')) return
    setDeletingId(variantId)
    try {
      await deleteVariant(variantId)
      toast.success('Varyant silindi')
      router.refresh()
    } catch (e: any) {
      toast.error('Silinemedi: ' + e.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="lg:col-span-3 bg-white border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">Varyantlar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Örn. &quot;Ayak Rengi: Siyah&quot;, &quot;Kumaş: Kadife&quot; gibi seçenekler. Fiyat/stok boş bırakılırsa ürünün kendi değerleri kullanılır.
          </p>
        </div>
        {!adding && !editingId && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
            <Plus size={14} className="mr-1" /> Varyant Ekle
          </Button>
        )}
      </div>

      {variants.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-3">Henüz varyant eklenmemiş.</p>
      )}

      <div className="space-y-2">
        {variants.map((variant) => (
          <div key={variant.id}>
            {editingId === variant.id && form ? (
              <VariantForm
                form={form}
                setForm={setForm}
                updateAttr={updateAttr}
                addAttrRow={addAttrRow}
                removeAttrRow={removeAttrRow}
                applyTemplateOption={applyTemplateOption}
                templates={templates}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
              />
            ) : (
              <div className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{variant.name}</span>
                    {!variant.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pasif</span>
                    )}
                  </div>
                  {Object.keys(variant.attributes ?? {}).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {variant.price != null ? `${variant.price.toLocaleString('tr-TR')} ₺` : 'Ürün fiyatı'}
                    {variant.sale_price != null && ` (indirimli: ${variant.sale_price.toLocaleString('tr-TR')} ₺)`}
                    {' · '}Stok: {variant.stock}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(variant)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(variant.id)}
                    disabled={deletingId === variant.id}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === variant.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && form && (
          <VariantForm
            form={form}
            setForm={setForm}
            updateAttr={updateAttr}
            addAttrRow={addAttrRow}
            removeAttrRow={removeAttrRow}
            applyTemplateOption={applyTemplateOption}
            templates={templates}
            onSave={handleSave}
            onCancel={cancel}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

function VariantForm({
  form,
  setForm,
  updateAttr,
  addAttrRow,
  removeAttrRow,
  applyTemplateOption,
  templates,
  onSave,
  onCancel,
  saving,
}: {
  form: FormState
  setForm: (f: FormState) => void
  updateAttr: (index: number, field: 'key' | 'value', value: string) => void
  addAttrRow: () => void
  removeAttrRow: (index: number) => void
  applyTemplateOption: (templateName: string, option: string) => void
  templates: VariantTemplate[]
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const [pickerTemplateId, setPickerTemplateId] = useState('')
  const pickerTemplate = templates.find((t) => t.id === pickerTemplateId) ?? null

  return (
    <div className="border border-[#222222]/40 rounded-xl p-4 space-y-3 bg-[#222222]/5">
      <div className="space-y-1.5">
        <Label>Varyant Adı *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="örn. Siyah / Büyük Boy"
        />
      </div>

      {templates.length > 0 && (
        <div className="space-y-1.5">
          <Label>Şablondan Ekle</Label>
          <select
            value={pickerTemplateId}
            onChange={(e) => setPickerTemplateId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 bg-background"
          >
            <option value="">Bir şablon seçin...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {pickerTemplate && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {pickerTemplate.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => applyTemplateOption(pickerTemplate.name, option)}
                  className="px-2.5 py-1 rounded-md border border-border text-xs hover:bg-[#C8B8A6] hover:border-[#C8B8A6] hover:text-[#222222] transition-colors"
                >
                  {pickerTemplate.name}: {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Öznitelikler</Label>
        <div className="space-y-2">
          {form.attrs.map((attr, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={attr.key}
                onChange={(e) => updateAttr(i, 'key', e.target.value)}
                placeholder="Etiket (örn. Ayak Rengi)"
                className="flex-1"
              />
              <Input
                value={attr.value}
                onChange={(e) => updateAttr(i, 'value', e.target.value)}
                placeholder="Değer (örn. Siyah)"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeAttrRow(i)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addAttrRow} className="text-xs text-[#222222] hover:underline">
          + Öznitelik ekle
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label>Fiyat (₺)</Label>
          <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Ürün fiyatı" />
        </div>
        <div className="space-y-1.5">
          <Label>İndirimli Fiyat (₺)</Label>
          <Input type="number" min={0} value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} placeholder="Opsiyonel" />
        </div>
        <div className="space-y-1.5">
          <Label>Stok *</Label>
          <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Sıra</Label>
          <Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="accent-[#222222] w-4 h-4"
        />
        <span className="text-sm font-medium">Aktif (sitede görünsün)</span>
      </label>

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
