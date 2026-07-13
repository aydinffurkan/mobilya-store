'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveComponent, deleteComponent, applyComponentTemplate } from '@/app/admin/urunler/actions'
import { ProductComponent, ComponentTemplate } from '@/types'
import { Plus, Pencil, Trash2, Loader2, Wand2, ImagePlus, X as XIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  productId: string
  components: ProductComponent[]
  templates?: ComponentTemplate[]
}

interface FormState {
  name: string
  unit_price: string
  included_by_default: boolean
  min_quantity: string
  max_quantity: string
  stock: string
  sort_order: string
  is_active: boolean
  image_url: string
}

const emptyForm = (sortOrder: number): FormState => ({
  name: '',
  unit_price: '0',
  included_by_default: true,
  min_quantity: '0',
  max_quantity: '1',
  stock: '0',
  sort_order: String(sortOrder),
  is_active: true,
  image_url: '',
})

const toFormState = (c: ProductComponent): FormState => ({
  name: c.name,
  unit_price: String(c.unit_price),
  included_by_default: c.default_quantity > 0,
  min_quantity: String(c.min_quantity),
  max_quantity: String(c.max_quantity),
  stock: String(c.stock),
  sort_order: String(c.sort_order),
  is_active: c.is_active,
  image_url: c.image_url ?? '',
})

export default function ComponentManager({ productId, components, templates = [] }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pickerTemplateId, setPickerTemplateId] = useState('')
  const [applyingTemplate, setApplyingTemplate] = useState(false)

  const handleApplyTemplate = async () => {
    if (!pickerTemplateId) return
    const template = templates.find((t) => t.id === pickerTemplateId)
    if (!template) return
    if (!confirm(`"${template.name}" şablonundaki ${template.items.length} parça bu ürüne eklenecek. Devam edilsin mi?`)) return

    setApplyingTemplate(true)
    try {
      await applyComponentTemplate(productId, pickerTemplateId, components.length)
      toast.success('Şablon uygulandı, parçalar eklendi')
      setPickerTemplateId('')
      router.refresh()
    } catch (e: any) {
      toast.error('Şablon uygulanamadı: ' + e.message)
    } finally {
      setApplyingTemplate(false)
    }
  }

  const startAdd = () => {
    setEditingId(null)
    setAdding(true)
    setForm(emptyForm(components.length))
  }

  const startEdit = (component: ProductComponent) => {
    setAdding(false)
    setEditingId(component.id)
    setForm(toFormState(component))
  }

  const cancel = () => {
    setAdding(false)
    setEditingId(null)
    setForm(null)
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.name.trim()) {
      toast.error('Parça adı gerekli')
      return
    }

    const minQty = Number(form.min_quantity) || 0
    const maxQty = Number(form.max_quantity) || 0
    const defaultQty = form.included_by_default ? 1 : 0
    if (maxQty < minQty) {
      toast.error('Maksimum adet, minimum adetten küçük olamaz')
      return
    }
    if (defaultQty < minQty || defaultQty > maxQty) {
      toast.error('"Varsayılan olarak dahil" işaretliyse parça en az 1 adet seçilebilmeli; min/maks aralığını kontrol edin')
      return
    }

    setSaving(true)
    try {
      await saveComponent(productId, editingId, {
        name: form.name.trim(),
        unit_price: Number(form.unit_price) || 0,
        default_quantity: defaultQty,
        min_quantity: minQty,
        max_quantity: maxQty,
        stock: Number(form.stock) || 0,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        image_url: form.image_url || null,
      })
      toast.success(editingId ? 'Parça güncellendi' : 'Parça eklendi')
      cancel()
      router.refresh()
    } catch (e: any) {
      toast.error('Kaydedilemedi: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (componentId: string) => {
    if (!confirm('Bu parçayı silmek istediğinize emin misiniz?')) return
    setDeletingId(componentId)
    try {
      await deleteComponent(componentId)
      toast.success('Parça silindi')
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
          <h3 className="font-semibold">Ürün İçeriği (Parçalar)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Örn. &quot;Yatak Odası Takımı&quot; ürünü için &quot;Komodin&quot;, &quot;Şifonyer&quot; gibi parçalar. <strong>Buraya en az bir parça eklerseniz</strong>, ürün sayfasındaki fiyat artık ürünün kendi fiyatı değil, müşterinin seçtiği parçaların (birim fiyat × adet) toplamı olur — hiç parça eklemezseniz ürün fiyatı her zamanki gibi varsayılan kalır. Buradaki stok yalnızca takip amaçlıdır — ürün detayında gösterilen stok her zaman ürünün kendi stok değeridir.
          </p>
        </div>
        {!adding && !editingId && (
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white flex-shrink-0">
            <Plus size={14} className="mr-1" /> Parça Ekle
          </Button>
        )}
      </div>

      {templates.length > 0 && !adding && !editingId && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl border border-dashed border-[#222222]/40 bg-[#222222]/5">
          <Wand2 size={16} className="text-[#222222] flex-shrink-0" />
          <select
            value={pickerTemplateId}
            onChange={(e) => setPickerTemplateId(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-border bg-white px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40"
          >
            <option value="">Bir parça şablonu seçin...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.items.length} parça)
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleApplyTemplate}
            disabled={!pickerTemplateId || applyingTemplate}
            className="flex-shrink-0 border-[#222222] text-[#222222] hover:bg-[#222222] hover:text-white"
          >
            {applyingTemplate ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Uygula
          </Button>
        </div>
      )}

      {components.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-3">Henüz parça eklenmemiş. Bu alan, çok parçalı ürünler (yatak odası takımı vb.) için isteğe bağlıdır.</p>
      )}

      <div className="space-y-2">
        {components.map((component) => (
          <div key={component.id}>
            {editingId === component.id && form ? (
              <ComponentForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} saving={saving} />
            ) : (
              <div className="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {component.image_url ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative border border-border">
                      <Image src={component.image_url} alt={component.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center border border-border border-dashed">
                      <ImagePlus size={14} className="text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{component.name}</span>
                      {!component.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pasif</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Birim fiyat: {component.unit_price.toLocaleString('tr-TR')} ₺
                      {' · '}{component.default_quantity > 0 ? 'Varsayılan: dahil (1 adet)' : 'Varsayılan: dahil değil (opsiyonel)'}
                      {' · '}Aralık: {component.min_quantity}-{component.max_quantity}
                      {' · '}Stok: {component.stock}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(component)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(component.id)}
                    disabled={deletingId === component.id}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === component.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && form && (
          <ComponentForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} saving={saving} />
        )}
      </div>
    </div>
  )
}

function ComponentForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: FormState
  setForm: (f: FormState) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `component-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from('product-images').upload(path, file)
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path)
      setForm({ ...form, image_url: urlData.publicUrl })
    } catch (e: any) {
      toast.error('Görsel yüklenemedi: ' + e.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleImageRemove = async () => {
    if (!form.image_url) return
    try {
      const supabase = createClient()
      const path = form.image_url.split('/product-images/')[1]?.split('?')[0]
      if (path) await supabase.storage.from('product-images').remove([path])
    } catch {}
    setForm({ ...form, image_url: '' })
  }

  return (
    <div className="border border-[#222222]/40 rounded-xl p-4 space-y-3 bg-[#222222]/5">
      {/* Görsel */}
      <div className="space-y-1.5">
        <Label>Parça Görseli</Label>
        {form.image_url ? (
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
              <Image src={form.image_url} alt="" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={handleImageRemove}
              className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
            >
              <XIcon size={12} /> Görseli Kaldır
            </button>
          </div>
        ) : (
          <label className={`inline-flex items-center gap-2 cursor-pointer px-3 py-2 border border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} className="text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{uploading ? 'Yükleniyor...' : 'Görsel Seç'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Parça Adı *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="örn. Komodin"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Birim Fiyat (₺) *</Label>
          <Input type="number" min={0} value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Stok</Label>
          <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Min. Adet *</Label>
          <Input type="number" min={0} value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Maks. Adet *</Label>
          <Input type="number" min={0} value={form.max_quantity} onChange={(e) => setForm({ ...form, max_quantity: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Sıra</Label>
          <Input type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Müşteri bu parçanın adedini Min-Maks aralığında değiştirebilir. Ürün fiyatı, seçili tüm parçaların (birim fiyat × adet) toplamı olarak hesaplanır.
      </p>

      <div className="space-y-2.5">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.included_by_default}
            onChange={(e) => setForm({ ...form, included_by_default: e.target.checked })}
            className="accent-[#222222] w-4 h-4"
          />
          <span className="text-sm font-medium">Varsayılan olarak dahil (1 adet ile gelsin)</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="accent-[#222222] w-4 h-4"
          />
          <span className="text-sm font-medium">Aktif (sitede görünsün)</span>
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={saving || uploading} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
      </div>
    </div>
  )
}
