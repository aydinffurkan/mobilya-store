'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveVariantTemplate, deleteVariantTemplate } from '@/app/admin/varyantlar/actions'
import { VariantTemplate } from '@/types'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'

interface Props {
  templates: VariantTemplate[]
}

interface FormState {
  name: string
  options: string[]
}

const emptyForm = (): FormState => ({ name: '', options: [''] })

const toFormState = (t: VariantTemplate): FormState => ({
  name: t.name,
  options: t.options.length > 0 ? [...t.options] : [''],
})

export default function VariantTemplateManager({ templates }: Props) {
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

  const startEdit = (template: VariantTemplate) => {
    setAdding(false)
    setEditingId(template.id)
    setForm(toFormState(template))
  }

  const cancel = () => {
    setAdding(false)
    setEditingId(null)
    setForm(null)
  }

  const updateOption = (index: number, value: string) => {
    if (!form) return
    setForm({ ...form, options: form.options.map((o, i) => (i === index ? value : o)) })
  }

  const addOptionRow = () => {
    if (!form) return
    setForm({ ...form, options: [...form.options, ''] })
  }

  const removeOptionRow = (index: number) => {
    if (!form) return
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) })
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.name.trim()) {
      toast.error('Şablon adı gerekli')
      return
    }
    const options = form.options.map((o) => o.trim()).filter(Boolean)
    if (options.length === 0) {
      toast.error('En az bir seçenek girin')
      return
    }

    setSaving(true)
    try {
      await saveVariantTemplate(editingId, { name: form.name.trim(), options })
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
      await deleteVariantTemplate(templateId)
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
          <h3 className="font-semibold">Varyant Şablonları</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sık kullanılan varyant gruplarını burada tanımlayın (örn. &quot;Ayak Rengi&quot; → Siyah, Altın, Gümüş). Ürün düzenleme sayfasında bu şablonlardan hızlıca seçim yapabilirsiniz.
          </p>
        </div>
        {!adding && !editingId && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#8B6914] hover:bg-[#7a5c12] text-white flex-shrink-0">
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
                updateOption={updateOption}
                addOptionRow={addOptionRow}
                removeOptionRow={removeOptionRow}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
              />
            ) : (
              <div className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <span className="font-medium text-sm">{template.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{template.options.join(' · ')}</p>
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
            updateOption={updateOption}
            addOptionRow={addOptionRow}
            removeOptionRow={removeOptionRow}
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
  updateOption,
  addOptionRow,
  removeOptionRow,
  onSave,
  onCancel,
  saving,
}: {
  form: FormState
  setForm: (f: FormState) => void
  updateOption: (index: number, value: string) => void
  addOptionRow: () => void
  removeOptionRow: (index: number) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="border border-[#8B6914]/40 rounded-xl p-4 space-y-3 bg-[#8B6914]/5">
      <div className="space-y-1.5">
        <Label>Şablon Adı *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="örn. Ayak Rengi"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Seçenekler *</Label>
        <div className="space-y-2">
          {form.options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder="örn. Siyah"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeOptionRow(i)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addOptionRow} className="text-xs text-[#8B6914] hover:underline">
          + Seçenek ekle
        </button>
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
