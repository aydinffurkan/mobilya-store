'use client'

import { useCallback, useEffect, useRef, useState, Suspense, type JSX } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useCartStore, itemKey } from '@/store/cartStore'
import { useCouponStore } from '@/store/couponStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, Lock, MapPin, Plus, Home, Landmark, ChevronRight, Tag, Loader2 } from 'lucide-react'
import { type Address, saveAddress } from '@/lib/actions/account'
import type { PaymentMethodsConfig } from '@/lib/actions/payment-methods'
import { validateVoucher } from '@/lib/actions/points'

const schema = z.object({
  full_name: z.string().min(3, 'Ad soyad en az 3 karakter olmalı'),
  email:     z.string().email('Geçerli bir e-posta girin'),
  phone:     z.string().min(10, 'Geçerli bir telefon numarası girin'),
  address:   z.string().min(10, 'Adres en az 10 karakter olmalı'),
  city:      z.string().min(2, 'Şehir giriniz'),
  district:  z.string().min(2, 'İlçe giriniz'),
  zip_code:  z.string().min(5, 'Posta kodu giriniz'),
})

type FormData = z.infer<typeof schema>

const INSTALLMENTS = [
  { value: 1,  label: 'Tek Çekim' },
  { value: 2,  label: '2 Taksit'  },
  { value: 3,  label: '3 Taksit'  },
  { value: 6,  label: '6 Taksit'  },
  { value: 9,  label: '9 Taksit'  },
  { value: 12, label: '12 Taksit' },
]

const ADDRESS_TITLES = ['Ev', 'İş', 'Diğer']

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

type PayMethod = 'card' | 'cod' | 'transfer'

function CheckoutInner() {
  const { items, totalPrice, clearCart } = useCartStore()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [userId,       setUserId]       = useState<string | null>(null)
  const [authChecked,  setAuthChecked]  = useState(false)
  const [installment,  setInstallment]  = useState(1)
  const [cardNumber,   setCardNumber]   = useState('')
  const [cardHolder,   setCardHolder]   = useState('')
  const [cardExpiry,   setCardExpiry]   = useState('')
  const [cardCvv,      setCardCvv]      = useState('')
  const [cardErrors,   setCardErrors]   = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [payMethod,    setPayMethod]    = useState<PayMethod>('card')
  const [methods,      setMethods]      = useState<PaymentMethodsConfig | null>(null)
  const [voucherInput,   setVoucherInput]   = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<{ id: string; code: string; amount: number } | null>(null)
  const [voucherLoading, setVoucherLoading] = useState(false)

  // Address state
  const [savedAddresses,   setSavedAddresses]   = useState<Address[]>([])
  const [selectedAddrId,   setSelectedAddrId]   = useState<string | 'new' | null>(null)
  const [saveThisAddress,  setSaveThisAddress]  = useState(false)
  const [saveTitle,        setSaveTitle]        = useState('Ev')

  const redirectFormRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
  })

  const applyAddress = useCallback((addr: Address) => {
    setValue('full_name', addr.full_name)
    setValue('phone',     addr.phone)
    setValue('address',   addr.address)
    setValue('city',      addr.city)
    setValue('district',  addr.district)
    setValue('zip_code',  addr.postal_code)
  }, [setValue])

  useEffect(() => {
    // Ödeme yöntemlerini yükle
    fetch('/api/payment/methods').then(r => r.json()).then((data: PaymentMethodsConfig) => {
      setMethods(data)
      // İlk aktif yöntemi seç
      if (data.card) setPayMethod('card')
      else if (data.cod) setPayMethod('cod')
      else if (data.transfer) setPayMethod('transfer')
    }).catch(() => { /* fallback: card */ })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/auth/giris?redirect=/odeme')
        setAuthChecked(true)
        return
      }
      const uid = data.user.id
      setUserId(uid)
      setAuthChecked(true)

      if (data.user.email) setValue('email', data.user.email)

      const { data: addrs } = await supabase
        .from('user_addresses')
        .select('id,title,full_name,phone,city,district,address,postal_code,is_default')
        .eq('user_id', uid)
        .order('is_default', { ascending: false })

      if (addrs && addrs.length > 0) {
        const addresses = addrs as Address[]
        setSavedAddresses(addresses)
        const def = addresses.find(a => a.is_default) ?? addresses[0]
        setSelectedAddrId(def.id)
        applyAddress(def)
      } else {
        setSelectedAddrId('new')
        const { data: profile } = await supabase
          .from('profiles').select('full_name,phone').eq('id', uid).single()
        if (profile?.full_name) setValue('full_name', profile.full_name as string)
        if (profile?.phone)     setValue('phone',     profile.phone as string)
      }
    })
  }, [router, applyAddress, setValue])

  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'cancel') toast.error('Ödeme iptal edildi.')
    if (status === 'error')  toast.error('Ödeme sırasında bir hata oluştu.')
  }, [searchParams])

  // Sepetten gelen GC- hediye çeki kuponu varsa checkout'a otomatik uygula
  useEffect(() => {
    const { code, type, value } = useCouponStore.getState()
    if (code?.startsWith('GC-') && type === 'fixed' && value > 0) {
      setAppliedVoucher((prev) => prev ?? { id: '', code, amount: value })
    }
  }, [])

  const total          = totalPrice()
  const discountAmount = Math.min(appliedVoucher?.amount ?? 0, total)
  const effectiveTotal = Math.max(0, Math.round((total - discountAmount) * 100) / 100)
  const codTotal       = methods?.cod ? effectiveTotal + (methods.codFee ?? 0) : effectiveTotal

  if (!authChecked) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-muted-foreground">Yükleniyor...</div>
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Sepetiniz boş</h1>
        <Link href="/urunler" className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#222222] text-white text-sm font-medium">
          Alışverişe Başla
        </Link>
      </div>
    )
  }

  const validateCard = () => {
    const errs: Record<string, string> = {}
    const digits = cardNumber.replace(/\s/g, '')
    if (digits.length < 16) errs.number = 'Kart numarası 16 hane olmalı'
    if (!cardHolder.trim()) errs.holder  = 'Kart sahibi adı zorunlu'
    const [m, y] = cardExpiry.split('/')
    if (!m || !y || m.length < 2 || y.length < 2) errs.expiry = 'AA/YY formatında girin'
    if (cardCvv.length < 3) errs.cvv    = 'CVV en az 3 hane olmalı'
    setCardErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (data: FormData) => {
    if (payMethod === 'card' && !validateCard()) return
    if (!userId) return
    setIsSubmitting(true)

    try {
      if (saveThisAddress && selectedAddrId === 'new') {
        await saveAddress(null, {
          title: saveTitle, full_name: data.full_name, phone: data.phone,
          city: data.city, district: data.district, address: data.address,
          postal_code: data.zip_code, is_default: savedAddresses.length === 0,
        }).catch(() => {})
      }

      const cartItems = items.map(({ product, quantity, variant, components }) => {
        const unitPrice = components && components.length > 0
          ? components.reduce((sum, c) => sum + c.quantity * c.unit_price, 0)
          : variant?.price != null
            ? (variant.sale_price ?? variant.price)
            : (product.sale_price ?? product.price)
        return {
          product_id: product.id, product_name: product.name, quantity, unit_price: unitPrice,
          variant_id: variant?.id ?? null, variant_name: variant?.name ?? null,
          components_config: components && components.length > 0 ? components : null,
        }
      })

      // ── Kredi kartı (QNBPay) ──────────────────────────────────────────────
      if (payMethod === 'card') {
        const res = await fetch('/api/payment/qnbpay/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingData: data,
            cardData: { number: cardNumber, holder: cardHolder, expiry: cardExpiry, cvv: cardCvv },
            cartItems, total: effectiveTotal, installment,
            voucherCode: appliedVoucher?.code ?? null,
          }),
        })
        const result = await res.json()
        if (!res.ok || result.error) { toast.error(result.error ?? 'Ödeme başlatılamadı'); setIsSubmitting(false); return }
        clearCart()
        if (result.formHtml && redirectFormRef.current) {
          redirectFormRef.current.innerHTML = result.formHtml
          const form = redirectFormRef.current.querySelector<HTMLFormElement>('form')
          if (form) { form.submit(); return }
        }
        router.push('/')
        return
      }

      // ── Kapıda ödeme / Havale ─────────────────────────────────────────────
      const res = await fetch('/api/payment/alternative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: payMethod, shippingData: data, cartItems, voucherCode: appliedVoucher?.code ?? null }),
      })
      const result = await res.json()
      if (!res.ok || result.error) { toast.error(result.error ?? 'Sipariş oluşturulamadı'); setIsSubmitting(false); return }
      clearCart()
      router.push(`/odeme/basarili?orderId=${result.orderId}&method=${payMethod}`)
    } catch {
      toast.error('Ağ hatası, lütfen tekrar deneyin')
      setIsSubmitting(false)
    }
  }

  const installmentTotal = (effectiveTotal / installment).toLocaleString('tr-TR', { maximumFractionDigits: 2 })

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return
    setVoucherLoading(true)
    try {
      const v = await validateVoucher(voucherInput.trim())
      setAppliedVoucher(v)
      setVoucherInput('')
      toast.success(`Hediye çeki uygulandı: -${v.amount.toLocaleString('tr-TR')} ₺`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Geçersiz hediye çeki')
    } finally {
      setVoucherLoading(false)
    }
  }

  type MethodOption = { key: PayMethod; label: string; icon: JSX.Element; description?: string }
  const availableMethods: MethodOption[] = []
  // Kart: methods yüklenmediyse (null) veya card=true ise göster
  if (!methods || methods.card) availableMethods.push({ key: 'card', label: 'Kredi / Banka Kartı', icon: <CreditCard size={16} />, description: '3D Secure güvencesiyle' })
  if (methods?.cod)             availableMethods.push({ key: 'cod',  label: 'Kapıda Ödeme',       icon: <Home size={16} />, description: methods.codDescription || undefined })
  if (methods?.transfer)        availableMethods.push({ key: 'transfer', label: 'Havale / EFT',   icon: <Landmark size={16} />, description: methods.transferDescription || undefined })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div ref={redirectFormRef} className="sr-only" />
      <h1 className="text-2xl font-bold mb-6">Ödeme</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-6">

          {/* ── Ödeme yöntemi seçimi ── */}
          {availableMethods.length >= 1 && (
            <div className="border border-border rounded-2xl p-5 bg-card">
              <h2 className="font-bold mb-4 text-sm">Ödeme Yöntemi</h2>
              <div className="space-y-2">
                {availableMethods.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPayMethod(m.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      payMethod === m.key
                        ? 'border-[#222222] bg-[#222222]/5 shadow-sm'
                        : 'border-border hover:border-[#222222]/40'
                    }`}
                  >
                    <span className={`${payMethod === m.key ? 'text-[#222222]' : 'text-muted-foreground'}`}>{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{m.label}</span>
                      {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                    </div>
                    {payMethod === m.key && <div className="w-4 h-4 rounded-full bg-[#222222] flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 rounded-full bg-white" /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Kayıtlı adresler ── */}
          {savedAddresses.length > 0 && (
            <div className="border border-border rounded-2xl p-5 bg-card">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm tracking-wide">
                <MapPin size={15} className="text-muted-foreground" />
                Kayıtlı Adreslerim
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {savedAddresses.map(addr => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => { setSelectedAddrId(addr.id); applyAddress(addr) }}
                    className={`flex-none w-44 text-left p-3 rounded-xl border text-sm transition-all ${
                      selectedAddrId === addr.id
                        ? 'border-[#222222] bg-[#222222]/5 shadow-sm'
                        : 'border-border hover:border-[#222222]/40'
                    }`}
                  >
                    <span className="font-semibold block truncate">{addr.title}</span>
                    <span className="text-muted-foreground text-xs block truncate mt-0.5">{addr.full_name}</span>
                    <span className="text-muted-foreground text-xs block mt-1">{addr.district} / {addr.city}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAddrId('new')}
                  className={`flex-none w-32 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed transition-all ${
                    selectedAddrId === 'new'
                      ? 'border-[#222222] bg-[#222222]/5 text-[#222222]'
                      : 'border-border text-muted-foreground hover:border-[#222222]/50'
                  }`}
                >
                  <Plus size={16} />
                  <span className="text-xs">Yeni Adres</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Teslimat Bilgileri ── */}
          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-bold mb-4">Teslimat Bilgileri</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="full_name">Ad Soyad</Label>
                <Input id="full_name" {...register('full_name')} placeholder="Örn: Ahmet Yılmaz" />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" {...register('email')} placeholder="ornek@mail.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" {...register('phone')} placeholder="05xx xxx xx xx" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" {...register('address')} placeholder="Mahalle, cadde, sokak, no..." />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Şehir</Label>
                <Input id="city" {...register('city')} placeholder="İstanbul" />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">İlçe</Label>
                <Input id="district" {...register('district')} placeholder="Kadıköy" />
                {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip_code">Posta Kodu</Label>
                <Input id="zip_code" {...register('zip_code')} placeholder="34000" />
                {errors.zip_code && <p className="text-xs text-destructive">{errors.zip_code.message}</p>}
              </div>

              {selectedAddrId === 'new' && (
                <div className="sm:col-span-2 border-t border-border/50 pt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none group w-fit">
                    <input
                      type="checkbox"
                      checked={saveThisAddress}
                      onChange={e => setSaveThisAddress(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#222222]"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      Bu adresi adreslerime kaydet
                    </span>
                  </label>
                  {saveThisAddress && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Adres başlığı</p>
                      <div className="flex gap-2 flex-wrap items-center">
                        {ADDRESS_TITLES.map(t => (
                          <button key={t} type="button" onClick={() => setSaveTitle(t)}
                            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${saveTitle === t ? 'border-[#222222] bg-[#222222] text-white' : 'border-border hover:border-[#222222]/50'}`}>
                            {t}
                          </button>
                        ))}
                        <input
                          type="text"
                          value={ADDRESS_TITLES.includes(saveTitle) ? '' : saveTitle}
                          onChange={e => setSaveTitle(e.target.value || 'Diğer')}
                          placeholder="Özel isim..."
                          className="px-3 py-1 text-xs rounded-lg border border-border outline-none focus:border-[#222222] w-28 bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Kredi kartı alanları ── */}
          {payMethod === 'card' && (
            <div className="border border-border rounded-2xl p-5 bg-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <CreditCard size={18} />
                  Kart Bilgileri
                </h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock size={12} />
                  256-bit SSL ile şifrelenmiş
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Kart Numarası</Label>
                  <Input placeholder="0000 0000 0000 0000" value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    inputMode="numeric" maxLength={19} />
                  {cardErrors.number && <p className="text-xs text-destructive">{cardErrors.number}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Kart Üzerindeki İsim</Label>
                  <Input placeholder="AD SOYAD" value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())} />
                  {cardErrors.holder && <p className="text-xs text-destructive">{cardErrors.holder}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Son Kullanma</Label>
                    <Input placeholder="AA/YY" value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      inputMode="numeric" maxLength={5} />
                    {cardErrors.expiry && <p className="text-xs text-destructive">{cardErrors.expiry}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>CVV</Label>
                    <Input placeholder="000" value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputMode="numeric" maxLength={4} type="password" />
                    {cardErrors.cvv && <p className="text-xs text-destructive">{cardErrors.cvv}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Taksit Seçeneği</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {INSTALLMENTS.map(({ value, label }) => (
                      <button key={value} type="button" onClick={() => setInstallment(value)}
                        className={`px-3 py-2 text-sm rounded-xl border transition-colors ${installment === value ? 'border-[#222222] bg-[#222222] text-white' : 'border-border hover:border-[#222222]/50'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {installment > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">{installment} × {installmentTotal} ₺</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Kapıda ödeme bilgi kutusu ── */}
          {payMethod === 'cod' && (
            <div className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <Home size={16} /> Kapıda Ödeme
              </div>
              <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80">
                {methods?.codDescription || 'Kapıda nakit veya kredi kartı ile ödeme yapabilirsiniz.'}
              </p>
              {methods && methods.codFee > 0 && (
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Kapıda ödeme ücreti: +{methods.codFee.toLocaleString('tr-TR')} ₺
                </p>
              )}
            </div>
          )}

          {/* ── Havale/EFT bilgi kutusu ── */}
          {payMethod === 'transfer' && methods?.transferAccounts && methods.transferAccounts.length > 0 && (
            <div className="border border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 font-semibold text-sm">
                <Landmark size={16} /> Havale / EFT
              </div>
              <p className="text-sm text-violet-700/80 dark:text-violet-400/80">
                {methods.transferDescription || 'Sipariş numarasını açıklama olarak yazarak aşağıdaki hesaplardan birine havale yapabilirsiniz.'}
              </p>
              {methods.transferAccounts.map((acc) => (
                <div key={acc.id} className="bg-white dark:bg-neutral-900 rounded-xl p-4 space-y-1.5 border border-violet-100 dark:border-violet-900">
                  <p className="font-semibold text-sm">{acc.bank_name}</p>
                  <p className="text-sm text-muted-foreground">{acc.account_name}{acc.branch ? ` — ${acc.branch}` : ''}</p>
                  <p className="font-mono text-sm tracking-wider">{acc.iban}</p>
                </div>
              ))}
              <div className="flex items-start gap-2 text-xs text-violet-600 dark:text-violet-400">
                <ChevronRight size={13} className="mt-0.5 flex-shrink-0" />
                Siparişiniz havale alındıktan sonra onaylanacaktır.
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#222222] hover:bg-[#222222] hover:opacity-90 text-white font-semibold text-base"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {payMethod === 'card' ? '3D Güvenli Ödemeye Yönlendiriliyor...' : 'Sipariş Oluşturuluyor...'}
              </span>
            ) : (
              <>
                <Lock size={16} className="mr-2" />
                {payMethod === 'card'
                  ? installment > 1
                    ? `${installment} × ${installmentTotal} ₺ — Güvenli Öde`
                    : `${effectiveTotal.toLocaleString('tr-TR')} ₺ — Güvenli Öde`
                  : payMethod === 'cod'
                    ? `${codTotal.toLocaleString('tr-TR')} ₺ — Siparişi Tamamla`
                    : `${effectiveTotal.toLocaleString('tr-TR')} ₺ — Siparişi Tamamla`}
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {payMethod === 'card' ? '3D Secure ile güvende. Kart bilgileriniz şifreli aktarılır, saklanmaz.' : 'Siparişiniz oluşturulduktan sonra onay e-postası gönderilecektir.'}
          </p>
        </form>

        {/* ── Sipariş Özeti ── */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-2xl p-5 bg-card sticky top-24 space-y-4">
            <h2 className="font-bold">Sipariş Özeti</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map(({ product, quantity, variant, components }) => {
                const unitPrice = components && components.length > 0
                  ? components.reduce((sum, c) => sum + c.quantity * c.unit_price, 0)
                  : variant?.price != null
                    ? (variant.sale_price ?? variant.price)
                    : (product.sale_price ?? product.price)
                return (
                  <div key={itemKey(product.id, variant?.id, components)} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[160px]">
                      {product.name}{variant ? ` — ${variant.name}` : ''} × {quantity}
                    </span>
                    <span className="font-medium flex-shrink-0">
                      {(unitPrice * quantity).toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                )
              })}
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nakliye</span>
              <span className="text-green-600 font-medium">Ücretsiz</span>
            </div>

            {/* Hediye Çeki */}
            {!appliedVoucher ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Hediye Çeki</p>
                <div className="flex gap-2">
                  <Input
                    value={voucherInput}
                    onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="GC-XXXXXXXX"
                    className="text-xs font-mono h-8"
                    disabled={voucherLoading}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleApplyVoucher() } }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyVoucher()}
                    disabled={voucherLoading || !voucherInput.trim()}
                    className="flex-shrink-0 px-3 h-8 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {voucherLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                    Uygula
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                  <Tag size={12} />
                  <span className="font-mono text-xs">{appliedVoucher.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    -{appliedVoucher.amount.toLocaleString('tr-TR')} ₺
                  </span>
                  <button
                    type="button"
                    onClick={() => setAppliedVoucher(null)}
                    className="text-green-600 hover:text-destructive transition-colors text-xs leading-none"
                    aria-label="Hediye çekini kaldır"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {payMethod === 'cod' && methods && methods.codFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kapıda ödeme ücreti</span>
                <span className="font-medium">+{methods.codFee.toLocaleString('tr-TR')} ₺</span>
              </div>
            )}
            {payMethod === 'card' && installment > 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taksit</span>
                <span className="font-medium">{installment} × {installmentTotal} ₺</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Toplam</span>
              <span className="text-[#222222]">
                {(payMethod === 'cod' ? codTotal : effectiveTotal).toLocaleString('tr-TR')} ₺
              </span>
            </div>
            {payMethod === 'card' && (
              <div className="pt-2 flex flex-wrap gap-2 items-center justify-center opacity-60">
                {['visa', 'mastercard', 'troy'].map((c) => (
                  <span key={c} className="text-[10px] uppercase font-bold border border-border rounded px-2 py-0.5">{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-muted-foreground">Yükleniyor...</div>}>
      <CheckoutInner />
    </Suspense>
  )
}
