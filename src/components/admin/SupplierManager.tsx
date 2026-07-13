'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X, Check, Loader2, Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Supplier } from '@/types'
import { saveSupplier, deleteSupplier } from '@/app/admin/tedarikciler/actions'

interface Props {
  suppliers: Supplier[]
  productCounts?: Record<string, number>
}

const emptyForm = () => ({
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  notes: '',
})

export default function SupplierManager({ suppliers: initial, productCounts = {} }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initial)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [busy, setBusy] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const startAdd = () => {
    setEditingId(null)
    setForm(emptyForm())
    setAdding(true)
  }

  const startEdit = (s: Supplier) => {
    setAdding(false)
    setEditingId(s.id)
    setForm({
      name: s.name,
      contact_name: s.contact_name ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      notes: s.notes ?? '',
    })
  }

  const cancel = () => {
    setAdding(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Tedarikçi adı zorunlu')
      return
    }
    setBusy(true)
    try {
      const payload = {
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
      }
      await saveSupplier(editingId, payload)

      if (editingId) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
        )
        toast.success('Tedarikçi güncellendi')
      } else {
        // Refetch to get the new id — simple approach: reload from server via revalidate
        // For instant UI, add optimistically with temp id
        const tempId = `temp-${Date.now()}`
        setSuppliers((prev) => [
          ...prev,
          { id: tempId, ...payload, created_at: new Date().toISOString() },
        ])
        toast.success('Tedarikçi eklendi')
      }
      cancel()
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`"${s.name}" tedarikçisini silmek istediğinize emin misiniz? Bu tedarikçiye bağlı ürünlerin tedarikçisi kaldırılır.`)) return
    setBusy(true)
    try {
      await deleteSupplier(s.id)
      setSuppliers((prev) => prev.filter((x) => x.id !== s.id))
      toast.success('Tedarikçi silindi')
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold">Tedarikçiler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {suppliers.length} tedarikçi · {Object.values(productCounts).reduce((a, b) => a + b, 0)} ürün atanmış — yalnızca admin panelinde görünür
          </p>
        </div>
        {!adding && !editingId && (
          <Button size="sm" onClick={startAdd} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
            <Plus size={14} className="mr-1" /> Tedarikçi Ekle
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="border-b border-border p-5 bg-[#222222]/5">
          <h3 className="text-sm font-semibold mb-4">Yeni Tedarikçi</h3>
          <SupplierForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} busy={busy} />
        </div>
      )}

      {/* List */}
      {suppliers.length === 0 && !adding ? (
        <div className="px-5 py-12 text-center text-muted-foreground text-sm">
          Henüz tedarikçi eklenmemiş.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {suppliers.map((s) => (
            <div key={s.id}>
              {editingId === s.id ? (
                <div className="p-5 bg-[#222222]/5">
                  <h3 className="text-sm font-semibold mb-4">Tedarikçiyi Düzenle</h3>
                  <SupplierForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} busy={busy} />
                </div>
              ) : (
                <div className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#222222]/10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-[#222222]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{s.name}</p>
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                          (productCounts[s.id] ?? 0) > 0
                            ? 'bg-[#222222]/10 text-[#222222]'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {productCounts[s.id] ?? 0} ürün
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[s.contact_name, s.phone, s.email].filter(Boolean).join(' · ') || 'İletişim bilgisi yok'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(s.notes) && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {expandedId === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        disabled={busy}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        disabled={busy}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {expandedId === s.id && s.notes && (
                    <p className="mt-2 ml-11 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                      {s.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SupplierForm({
  form,
  setForm,
  onSave,
  onCancel,
  busy,
}: {
  form: ReturnType<typeof emptyForm>
  setForm: (f: ReturnType<typeof emptyForm>) => void
  onSave: () => void
  onCancel: () => void
  busy: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Firma Adı *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Örn: ABC Mobilya Ltd."
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label>Yetkili Kişi</Label>
          <Input
            value={form.contact_name}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            placeholder="Örn: Ahmet Yılmaz"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0532 000 00 00"
            type="tel"
          />
        </div>
        <div className="space-y-1.5">
          <Label>E-posta</Label>
          <Input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="info@firma.com"
            type="email"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notlar</Label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          placeholder="Teslimat koşulları, ödeme vadesi vb."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none bg-background"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={onSave} disabled={busy} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
          {busy ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Check size={13} className="mr-1.5" />}
          Kaydet
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={busy}>
          <X size={13} className="mr-1" /> Vazgeç
        </Button>
      </div>
    </div>
  )
}
