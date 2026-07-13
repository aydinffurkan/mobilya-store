'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, saveAddress, deleteAddress } from '@/lib/actions/account'
import { getProductsByIds } from '@/lib/actions/products'
import LogoutButton from '@/components/account/LogoutButton'
import ProductCard from '@/components/products/ProductCard'
import { useFavoritesStore } from '@/store/favoritesStore'
import {
  User, ShoppingBag, Lock, ChevronRight, Package, Heart, MapPin,
  Plus, Pencil, Trash2, Check, X, Loader2, Star, Truck, Clock,
  CheckCircle2, XCircle, ExternalLink, Wrench, RotateCcw, AlertCircle, ImageIcon,
  Coins, Gift,
} from 'lucide-react'
import PuanlarimTab    from '@/components/account/PuanlarimTab'
import HediyeCekleriTab from '@/components/account/HediyeCekleriTab'
import type { Product } from '@/types'
import type { Address, AddressPayload } from '@/lib/actions/account'
import { createTicket, type SupportTicket, type CreateTicketPayload } from '@/lib/actions/support'

// ─── Sabit eşlemeler ─────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  pending: 'Beklemede', confirmed: 'Onaylandı', shipped: 'Kargoda',
  delivered: 'Teslim Edildi', cancelled: 'İptal',
  payment_failed: 'Ödeme Başarısız', pending_transfer: 'Havale Bekleniyor',
}
const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  pending_transfer: 'bg-violet-100 text-violet-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  payment_failed: 'bg-red-100 text-red-700',
}

// ─── Tipler ──────────────────────────────────────────────────────────────────

type Tab = 'siparisler' | 'iade' | 'favoriler' | 'adresler' | 'profil' | 'sifre' | 'puan' | 'hediye'

interface Props {
  user: { id: string; email: string; created_at: string }
  profile: { full_name?: string; phone?: string } | null
  orders: any[]
  addresses: Address[]
  tickets: SupportTicket[]
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'siparisler', label: 'Siparişlerim',      icon: ShoppingBag },
  { key: 'iade',       label: 'Arıza / İade',      icon: Wrench      },
  { key: 'favoriler',  label: 'Favorilerim',       icon: Heart       },
  { key: 'adresler',   label: 'Adreslerim',        icon: MapPin      },
  { key: 'puan',       label: 'MessaPuanım',       icon: Coins       },
  { key: 'hediye',     label: 'Hediye Çeklerim',   icon: Gift        },
  { key: 'profil',     label: 'Profilim',          icon: User        },
  { key: 'sifre',      label: 'Şifre',             icon: Lock        },
]

// ─── Favoriler sekmesi ────────────────────────────────────────────────────────

function FavoritesTab() {
  const ids = useFavoritesStore((s) => s.ids)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); setLoading(false); return }
    setLoading(true)
    getProductsByIds(ids)
      .then((data) => setProducts((data as Product[]) ?? []))
      .finally(() => setLoading(false))
  }, [ids])

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl bg-neutral-100 animate-pulse" />
      ))}
    </div>
  )

  if (products.length === 0) return (
    <div className="bg-white border border-border rounded-2xl p-10 text-center">
      <Heart size={36} className="text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">Henüz favori ürün eklemediniz.</p>
      <Link href="/urunler" className="text-[#222222] hover:underline text-sm mt-2 block font-medium">
        Ürünlere göz at →
      </Link>
    </div>
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}

// ─── Sipariş timeline ────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { key: 'pending',   label: 'Beklemede',     icon: Clock        },
  { key: 'confirmed', label: 'Onaylandı',     icon: Check        },
  { key: 'shipped',   label: 'Kargoda',       icon: Truck        },
  { key: 'delivered', label: 'Teslim Edildi', icon: CheckCircle2 },
]
const STEP_ORDER: Record<string, number> = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 }

function OrderTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs">
        <XCircle size={14} className="text-red-500 flex-shrink-0" />
        <span className="font-semibold text-red-700">Sipariş İptal Edildi</span>
      </div>
    )
  }
  const currentIdx = STEP_ORDER[status] ?? 0
  return (
    <div className="flex items-start">
      {TIMELINE_STEPS.map((step, i) => {
        const done   = i < currentIdx
        const active = i === currentIdx
        const Icon   = step.icon
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${done ? 'bg-[#222222]' : 'bg-neutral-200'}`} />
            )}
            <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
              done ? 'bg-[#222222] border-[#222222]' : active ? 'bg-white border-[#222222]' : 'bg-white border-neutral-200'
            }`}>
              <Icon size={12} className={done ? 'text-white' : active ? 'text-[#222222]' : 'text-neutral-300'} />
            </div>
            <p className={`mt-1.5 text-[10px] font-medium text-center leading-tight ${done || active ? 'text-neutral-700' : 'text-neutral-400'}`}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

const CARRIER_URLS: Record<string, (n: string) => string> = {
  'Yurtiçi Kargo': (n) => `https://www.yurticikargo.com/tr/online-islemler/gonderi-sorgula?code=${n}`,
  'Aras Kargo':    (n) => `https://www.araskargo.com.tr/tr/kargo-sorgula?barcode=${n}`,
  'MNG Kargo':     (n) => `https://www.mngkargo.com.tr/gonderi-sorgulama?documentNo=${n}`,
  'PTT Kargo':     (n) => `https://www.ptt.gov.tr/tr/anasayfa/gonder-sorgula?barkod=${n}`,
  'Sürat Kargo':   (n) => `https://www.suratkargo.com.tr/KargoSorgulama/Default.aspx?BarkodNo=${n}`,
  'UPS':           (n) => `https://www.ups.com/track?loc=tr_TR&tracknum=${n}`,
  'DHL':           (n) => `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${n}`,
}

// ─── Sipariş kartı ────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: any }) {
  const [open, setOpen] = useState(false)

  const cargoUrl = order.carrier && order.tracking_number
    ? (CARRIER_URLS[order.carrier] ?? null)?.(order.tracking_number)
    : null

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-neutral-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-[#222222]/10 flex items-center justify-center flex-shrink-0">
          <Package size={16} className="text-[#222222]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-sm font-medium">
            {order.order_items?.length ?? 0} ürün
            <span className="text-muted-foreground font-normal"> · {new Date(order.created_at).toLocaleDateString('tr-TR')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] ?? ''}`}>
            {statusLabel[order.status] ?? order.status}
          </span>
          <span className={`inline-flex sm:hidden items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] ?? ''}`}>
            {statusLabel[order.status]?.split(' ')[0] ?? order.status}
          </span>
          <span className="font-bold text-[#222222] text-sm">{Number(order.total).toLocaleString('tr-TR')} ₺</span>
          <ChevronRight size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-neutral-50/50">
          {/* Timeline */}
          <div className="px-4 sm:px-5 pt-4 pb-3">
            <OrderTimeline status={order.status} />
          </div>

          {/* Kargo bilgisi */}
          {order.carrier && order.tracking_number && (
            <div className="mx-4 sm:mx-5 mb-3 flex items-center justify-between gap-3 bg-purple-50 border border-purple-100 rounded-xl px-3.5 py-2.5">
              <div>
                <p className="text-[11px] font-semibold text-purple-600">{order.carrier}</p>
                <p className="font-mono text-xs font-bold text-[#222]">{order.tracking_number}</p>
              </div>
              {cargoUrl && (
                <a
                  href={cargoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 text-white text-[11px] font-medium rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0"
                >
                  Kargo Takip <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}

          {/* Ürünler */}
          <div className="px-4 sm:px-5 pb-4 space-y-2">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                  {item.product?.images?.[0]
                    ? <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.product?.name ?? 'Ürün'}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} adet × {Number(item.unit_price).toLocaleString('tr-TR')} ₺</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Siparişler sekmesi ───────────────────────────────────────────────────────

type DateFilter = 'today' | 'month' | 'year' | 'all'

function OrdersTab({ orders, profile }: { orders: any[]; profile: Props['profile'] }) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const filtered = useMemo(() => {
    if (dateFilter === 'all') return orders
    const now = new Date()
    return orders.filter((o) => {
      const d = new Date(o.created_at)
      if (dateFilter === 'today') return d.toDateString() === now.toDateString()
      if (dateFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      return d.getFullYear() === now.getFullYear()
    })
  }, [orders, dateFilter])

  const fullName = profile?.full_name || 'Müşterimiz'

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 leading-relaxed">
        Sn. <strong className="text-neutral-900">{fullName}</strong>, sitemizden vermiş olduğunuz siparişler ile ilgili bilgiler aşağıda belirtilmiştir.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500 whitespace-nowrap">Sipariş Tarihi:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-700"
          >
            <option value="today">Bugün</option>
            <option value="month">Bu Ay</option>
            <option value="year">Bu Yıl</option>
            <option value="all">Tüm Zamanlar</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500 whitespace-nowrap">Gösterim Tipi:</label>
          <select className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-700">
            <option>Tüm Siparişlerim</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <ShoppingBag size={36} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {orders.length === 0 ? 'Henüz sipariş vermediniz.' : 'Bu dönemde sipariş bulunamadı.'}
          </p>
          {orders.length === 0 ? (
            <Link href="/urunler" className="text-[#222222] hover:underline text-sm mt-2 block font-medium">
              Alışverişe başla →
            </Link>
          ) : (
            <button onClick={() => setDateFilter('all')} className="text-[#222222] hover:underline text-sm mt-2 block font-medium mx-auto">
              Tüm siparişleri görüntüle →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="border-b border-border bg-neutral-50">
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-5 py-3">Sipariş No</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Ödeme Tipi</th>
                  <th className="text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Sipariş Tutarı</th>
                  <th className="text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Sipariş Tarihi</th>
                  <th className="text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order: any) => (
                  <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-neutral-700">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-neutral-600">{{
                        card: 'Kredi / Banka Kartı',
                        cod: 'Kapıda Ödeme',
                        transfer: 'Havale / EFT',
                      }[order.payment_method as string] ?? 'Kredi / Banka Kartı'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold text-neutral-900">{Number(order.total).toLocaleString('tr-TR')} ₺</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-neutral-600">
                        {new Date(order.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[order.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Arıza / İade sekmesi ─────────────────────────────────────────────────────

const TICKET_STATUS_LABEL: Record<string, string> = {
  beklemede:   'Beklemede',
  inceleniyor: 'İnceleniyor',
  cozuldu:     'Çözüldü',
  reddedildi:  'Reddedildi',
}
const TICKET_STATUS_COLOR: Record<string, string> = {
  beklemede:   'bg-amber-100 text-amber-700',
  inceleniyor: 'bg-blue-100 text-blue-700',
  cozuldu:     'bg-green-100 text-green-700',
  reddedildi:  'bg-red-100 text-red-700',
}

function IadeTab({ initialTickets, orders, userId }: { initialTickets: SupportTicket[]; orders: any[]; userId: string }) {
  const [tickets, setTickets]   = useState<SupportTicket[]>(initialTickets)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy]         = useState(false)
  const [form, setForm]         = useState<CreateTicketPayload>({
    order_id: null, type: 'iade', subject: '', description: '', images: [],
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews]           = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []).slice(0, 5 - selectedFiles.length)
    if (!newFiles.length) return
    setSelectedFiles((prev) => [...prev, ...newFiles].slice(0, 5))
    setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))].slice(0, 5))
    e.target.value = ''
  }

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i])
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Lütfen konu ve açıklama alanlarını doldurun')
      return
    }
    setBusy(true)
    try {
      // Fotoğrafları Supabase Storage'a yükle
      let imageUrls: string[] = []
      if (selectedFiles.length > 0) {
        const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
        const supabase = createBrowserClient()
        const uploads = await Promise.all(
          selectedFiles.map(async (file) => {
            const ext  = file.name.split('.').pop()
            const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const { data, error } = await supabase.storage.from('support-images').upload(path, file)
            if (error) throw new Error(error.message)
            const { data: { publicUrl } } = supabase.storage.from('support-images').getPublicUrl(data.path)
            return publicUrl
          })
        )
        imageUrls = uploads
      }

      await createTicket({ ...form, images: imageUrls })
      toast.success('Talebiniz oluşturuldu')
      setCreating(false)
      setForm({ order_id: null, type: 'iade', subject: '', description: '', images: [] })
      previews.forEach((p) => URL.revokeObjectURL(p))
      setSelectedFiles([])
      setPreviews([])
      setTickets((prev) => [{
        id: `temp-${Date.now()}`, order_id: form.order_id, type: form.type,
        status: 'beklemede', subject: form.subject, description: form.description,
        images: imageUrls, admin_note: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }, ...prev])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Yeni talep formu */}
      {creating ? (
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
          <h3 className="font-semibold text-sm mb-4">Yeni Talep Oluştur</h3>

          {/* Tip seçici */}
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Talep Tipi</p>
            <div className="flex gap-2">
              {(['iade', 'ariza'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.type === t
                      ? 'bg-[#222222] text-white border-[#222222]'
                      : 'bg-white text-neutral-600 border-border hover:border-neutral-400'
                  }`}
                >
                  {t === 'iade' ? <RotateCcw size={13} /> : <Wrench size={13} />}
                  {t === 'iade' ? 'İade Talebi' : 'Arıza Bildirimi'}
                </button>
              ))}
            </div>
          </div>

          {/* İlgili sipariş */}
          {orders.length > 0 && (
            <div className="mb-4 space-y-1.5">
              <Label>İlgili Sipariş <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
              <select
                value={form.order_id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value || null }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-[#222222]/40"
              >
                <option value="">Sipariş seçin...</option>
                {orders.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    #{o.id.slice(0, 8).toUpperCase()} — {new Date(o.created_at).toLocaleDateString('tr-TR')} — {Number(o.total).toLocaleString('tr-TR')} ₺
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Konu *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Örn: Ürün hasarlı geldi"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama *</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Sorununuzu detaylı olarak açıklayın..."
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#222222]/40 resize-none bg-background"
              />
            </div>

            {/* Fotoğraf yükleme */}
            <div className="space-y-2">
              <Label>Fotoğraflar <span className="text-muted-foreground font-normal">(opsiyonel, max 5)</span></Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {previews.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <ImageIcon size={14} /> Fotoğraf Ekle
                </button>
              )}
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={handleCreate} disabled={busy} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
                {busy ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Check size={13} className="mr-1.5" />}
                Gönder
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setCreating(false)} disabled={busy}>
                <X size={13} className="mr-1" /> Vazgeç
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-[#222222] text-white text-sm font-medium rounded-xl hover:opacity-80 transition-opacity"
        >
          <Plus size={15} /> Yeni Talep Oluştur
        </button>
      )}

      {/* Talep listesi */}
      {tickets.length === 0 && !creating ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <AlertCircle size={36} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Henüz arıza/iade talebiniz yok.</p>
        </div>
      ) : tickets.length > 0 ? (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {tickets.map((t) => (
              <div key={t.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      t.type === 'iade' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {t.type === 'iade' ? <RotateCcw size={10} /> : <Wrench size={10} />}
                      {t.type === 'iade' ? 'İade' : 'Arıza'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${TICKET_STATUS_COLOR[t.status] ?? ''}`}>
                      {TICKET_STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-neutral-800">{t.subject}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                {t.images && t.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.images.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-14 h-14 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                {t.admin_note && (
                  <div className="mt-2 px-3 py-2 bg-neutral-50 border border-border rounded-lg text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-700">Yetkili Notu: </span>{t.admin_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// ─── Profil sekmesi ───────────────────────────────────────────────────────────

function ProfileTab({ user, profile }: { user: Props['user']; profile: Props['profile'] }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName, phone })
      toast.success('Profil güncellendi')
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSave() }} className="space-y-5 max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Ad Soyad</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız Soyadınız" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" value={user.email} disabled className="bg-muted/50 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">E-posta değiştirilemez.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" type="tel" />
      </div>
      <div className="space-y-1.5">
        <Label>Üyelik Tarihi</Label>
        <p className="text-sm text-muted-foreground pt-1">
          {new Date(user.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <Button type="submit" disabled={saving} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
      </Button>
    </form>
  )
}

// ─── Şifre sekmesi ────────────────────────────────────────────────────────────

function PasswordTab() {
  const [current, setCurrent] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (newPw.length < 6) { toast.error('Yeni şifre en az 6 karakter olmalı'); return }
    if (newPw !== confirm) { toast.error('Şifreler eşleşmiyor'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current })
      if (signInErr) { toast.error('Mevcut şifre hatalı'); setLoading(false); return }
    }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)
    if (error) {
      toast.error('Şifre güncellenemedi: ' + error.message)
    } else {
      toast.success('Şifre güncellendi')
      setCurrent(''); setNewPw(''); setConfirm('')
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <Label htmlFor="current">Mevcut Şifre</Label>
        <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required placeholder="••••••••" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPw">Yeni Şifre</Label>
        <Input id="newPw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required placeholder="En az 6 karakter" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Yeni Şifre Tekrar</Label>
        <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="••••••••" />
      </div>
      {newPw && confirm && newPw !== confirm && (
        <p className="text-xs text-red-500">Şifreler eşleşmiyor</p>
      )}
      <Button type="submit" disabled={loading} className="bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white">
        {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
      </Button>
    </form>
  )
}

// ─── Adres formu yardımcıları ────────────────────────────────────────────────

const emptyAddressForm = (): AddressPayload => ({
  title: '', full_name: '', phone: '', city: '', district: '',
  address: '', postal_code: '', is_default: false,
})

// ─── Adresler sekmesi ─────────────────────────────────────────────────────────

function AddressesTab({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressPayload>(emptyAddressForm())
  const [busy, setBusy] = useState(false)

  const startAdd = () => {
    setEditingId(null)
    setForm(emptyAddressForm())
    setAdding(true)
  }

  const startEdit = (a: Address) => {
    setAdding(false)
    setEditingId(a.id)
    setForm({
      title: a.title, full_name: a.full_name, phone: a.phone,
      city: a.city, district: a.district, address: a.address,
      postal_code: a.postal_code, is_default: a.is_default,
    })
  }

  const cancel = () => { setAdding(false); setEditingId(null) }

  const handleSave = async () => {
    if (!form.title.trim() || !form.full_name.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error('Lütfen zorunlu alanları doldurun')
      return
    }
    setBusy(true)
    try {
      await saveAddress(editingId, form)
      if (editingId) {
        setAddresses((prev) => prev.map((a) =>
          a.id === editingId ? { ...a, ...form } : form.is_default ? { ...a, is_default: false } : a
        ))
        toast.success('Adres güncellendi')
      } else {
        const tempId = `temp-${Date.now()}`
        const newAddr: Address = { id: tempId, ...form }
        setAddresses((prev) => [
          ...(form.is_default ? prev.map((a) => ({ ...a, is_default: false })) : prev),
          newAddr,
        ])
        toast.success('Adres eklendi')
      }
      cancel()
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (a: Address) => {
    if (!confirm(`"${a.title}" adresini silmek istiyor musunuz?`)) return
    setBusy(true)
    try {
      await deleteAddress(a.id)
      setAddresses((prev) => prev.filter((x) => x.id !== a.id))
      toast.success('Adres silindi')
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const handleSetDefault = async (a: Address) => {
    if (a.is_default) return
    setBusy(true)
    try {
      await saveAddress(a.id, { ...a, is_default: true })
      setAddresses((prev) => prev.map((x) => ({ ...x, is_default: x.id === a.id })))
      toast.success('Varsayılan adres güncellendi')
    } catch (e: unknown) {
      toast.error('Hata: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Yeni adres formu */}
      {adding && (
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
          <h3 className="font-semibold mb-4 text-sm">Yeni Adres Ekle</h3>
          <AddressForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} busy={busy} />
        </div>
      )}

      {/* Adres listesi */}
      {addresses.length === 0 && !adding ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <MapPin size={36} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Henüz kayıtlı adresiniz yok.</p>
          <button
            onClick={startAdd}
            className="text-[#222222] hover:underline text-sm mt-2 block font-medium mx-auto"
          >
            İlk adresinizi ekleyin →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((a) => (
            <div key={a.id}>
              {editingId === a.id ? (
                <div className="bg-white border border-[#222222]/30 rounded-2xl p-5 sm:p-6">
                  <h3 className="font-semibold mb-4 text-sm">Adresi Düzenle</h3>
                  <AddressForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} busy={busy} />
                </div>
              ) : (
                <div className={`bg-white border rounded-2xl p-4 relative ${a.is_default ? 'border-[#222222]/50' : 'border-border'}`}>
                  {a.is_default && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#222222] bg-[#222222]/10 px-2 py-0.5 rounded-full">
                      <Star size={9} fill="currentColor" /> Varsayılan
                    </span>
                  )}
                  <div className="flex items-start gap-3 pr-20">
                    <div className="w-8 h-8 rounded-lg bg-[#222222]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin size={14} className="text-[#222222]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{a.full_name} · {a.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {a.address}<br />
                        {a.district}, {a.city}{a.postal_code ? ` ${a.postal_code}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                    {!a.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(a)}
                        disabled={busy}
                        className="text-xs text-muted-foreground hover:text-[#222222] transition-colors flex items-center gap-1 mr-auto"
                      >
                        <Check size={11} /> Varsayılan yap
                      </button>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => startEdit(a)}
                        disabled={busy}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a)}
                        disabled={busy}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Yeni adres ekle kartı */}
          {!adding && !editingId && (
            <button
              type="button"
              onClick={startAdd}
              className="bg-white border-2 border-dashed border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-[#222222]/40 hover:text-[#222222] transition-colors min-h-[120px]"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Yeni Adres Ekle</span>
            </button>
          )}
        </div>
      )}

    </div>
  )
}

// ─── Adres formu bileşeni ─────────────────────────────────────────────────────

function AddressForm({
  form, setForm, onSave, onCancel, busy,
}: {
  form: AddressPayload
  setForm: (f: AddressPayload) => void
  onSave: () => void
  onCancel: () => void
  busy: boolean
}) {
  const f = (field: keyof AddressPayload, value: string | boolean) =>
    setForm({ ...form, [field]: value })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Adres Başlığı *</Label>
          <Input value={form.title} onChange={(e) => f('title', e.target.value)} placeholder="Ev, İş, Yazlık…" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Ad Soyad *</Label>
          <Input value={form.full_name} onChange={(e) => f('full_name', e.target.value)} placeholder="Adınız Soyadınız" />
        </div>
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="05xx xxx xx xx" type="tel" />
        </div>
        <div className="space-y-1.5">
          <Label>Şehir *</Label>
          <Input value={form.city} onChange={(e) => f('city', e.target.value)} placeholder="İstanbul" />
        </div>
        <div className="space-y-1.5">
          <Label>İlçe</Label>
          <Input value={form.district} onChange={(e) => f('district', e.target.value)} placeholder="Kadıköy" />
        </div>
        <div className="space-y-1.5">
          <Label>Posta Kodu</Label>
          <Input value={form.postal_code} onChange={(e) => f('postal_code', e.target.value)} placeholder="34000" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Açık Adres *</Label>
        <textarea
          value={form.address}
          onChange={(e) => f('address', e.target.value)}
          rows={2}
          placeholder="Mahalle, sokak, daire no…"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/40 resize-none bg-background"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => f('is_default', e.target.checked)}
          className="accent-[#222222]"
        />
        <span className="text-sm">Varsayılan adresim olarak ayarla</span>
      </label>
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

// ─── Ana bileşen ──────────────────────────────────────────────────────────────

export default function HesabimClient({ user, profile, orders, addresses, tickets }: Props) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab') as Tab | null
    return TABS.some((x) => x.key === t) ? (t as Tab) : 'siparisler'
  })

  useEffect(() => {
    const t = searchParams.get('tab') as Tab | null
    if (TABS.some((x) => x.key === t)) setActiveTab(t as Tab)
    else setActiveTab('siparisler')
  }, [searchParams])

  const initials = (profile?.full_name ?? user.email).charAt(0).toUpperCase()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {/* Üst başlık */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#222222]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-[#222222]">{initials}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile?.full_name || 'Hesabım'}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <div className="bg-white border border-border rounded-xl px-4 py-3">
          <p className="text-2xl font-bold text-[#222222]">{orders.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sipariş</p>
        </div>
        <div className="bg-white border border-border rounded-xl px-4 py-3">
          <p className="text-lg sm:text-2xl font-bold text-[#222222] truncate">
            {orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0).toLocaleString('tr-TR')} ₺
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Harcama</p>
        </div>
        <div className="bg-white border border-border rounded-xl px-4 py-3">
          <p className="text-2xl font-bold text-[#222222]">{orders.filter(o => o.status === 'delivered').length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Teslim</p>
        </div>
      </div>


      {/* Sekme içerikleri */}
      {activeTab === 'siparisler' && (
        <OrdersTab orders={orders} profile={profile} />
      )}

      {activeTab === 'iade' && (
        <IadeTab initialTickets={tickets} orders={orders} userId={user.id} />
      )}

      {activeTab === 'favoriler' && <FavoritesTab />}

      {activeTab === 'adresler' && <AddressesTab initialAddresses={addresses} />}

      {activeTab === 'puan' && (
        <div>
          <div className="mb-5">
            <h2 className="font-semibold text-base">MessaPuanım</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Alışveriş, üyelik ve yorumlarınızla MessaPuan kazanın. MessaPuanlarınızı hediye çekine dönüştürerek kullanın.
            </p>
          </div>
          <PuanlarimTab />
        </div>
      )}

      {activeTab === 'hediye' && (
        <div>
          <div className="mb-5">
            <h2 className="font-semibold text-base">Hediye Çeklerim</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Puanlarınızdan oluşturduğunuz hediye çeklerini burada görüntüleyebilirsiniz.
            </p>
          </div>
          <HediyeCekleriTab />
        </div>
      )}

      {activeTab === 'profil' && (
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
          <h2 className="font-semibold mb-5">Profil Bilgileri</h2>
          <ProfileTab user={user} profile={profile} />
        </div>
      )}

      {activeTab === 'sifre' && (
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
          <h2 className="font-semibold mb-1">Şifre Değiştir</h2>
          <p className="text-sm text-muted-foreground mb-5">Güvenliğiniz için güçlü bir şifre seçin.</p>
          <PasswordTab />
        </div>
      )}
    </div>
  )
}
