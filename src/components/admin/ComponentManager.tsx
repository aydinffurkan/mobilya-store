'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveComponent, deleteComponent } from '@/app/admin/urunler/actions'
import { ProductComponent } from '@/types'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

interface Props {
  productId: string
  components: ProductComponent[]
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
})

export default function ComponentManager({ productId, components }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
          <Button type="button" size="sm" onClick={startAdd} className="bg-[#8B6914] hover:bg-[#7a5c12] text-white flex-shrink-0">
            <Plus size={14} className="mr-1" /> Parça Ekle
          </Button>
        )}
      </div>

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
  return (
    <div className="border border-[#8B6914]/40 rounded-xl p-4 space-y-3 bg-[#8B6914]/5">
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
            className="accent-[#8B6914] w-4 h-4"
          />
          <span className="text-sm font-medium">Varsayılan olarak dahil (1 adet ile gelsin)</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="accent-[#8B6914] w-4 h-4"
          />
          <span className="text-sm font-medium">Aktif (sitede görünsün)</span>
        </label>
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
