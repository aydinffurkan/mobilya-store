'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const schema = z.object({
  full_name: z.string().min(3, 'Ad soyad en az 3 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta girin'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası girin'),
  address: z.string().min(10, 'Adres en az 10 karakter olmalı'),
  city: z.string().min(2, 'Şehir giriniz'),
  district: z.string().min(2, 'İlçe giriniz'),
  zip_code: z.string().min(5, 'Posta kodu giriniz'),
})

type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: standardSchemaResolver(schema),
  })

  const total = totalPrice()

  const onSubmit = async (data: FormData) => {
    // TODO: Save order to Supabase
    console.log('Order:', { items, shipping: data, total })
    await new Promise((r) => setTimeout(r, 1000))
    clearCart()
    toast.success('Siparişiniz alındı! En kısa sürede sizinle iletişime geçeceğiz.')
    router.push('/')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Sepetiniz boş</h1>
          <Link href="/urunler" className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#8B6914] hover:bg-[#7a5c12] text-white text-sm font-medium transition-colors">
          Alışverişe Başla
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ödeme</h1>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 space-y-6">
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
            </div>
          </div>

          {/* Payment method placeholder */}
          <div className="border border-border rounded-2xl p-5 bg-card">
            <h2 className="font-bold mb-4">Ödeme Yöntemi</h2>
            <div className="space-y-3">
              {[
                { id: 'card', label: '💳 Kredi / Banka Kartı' },
                { id: 'transfer', label: '🏦 Havale / EFT' },
                { id: 'installment', label: '📅 Taksitli Ödeme' },
              ].map(({ id, label }) => (
                <label key={id} className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-secondary transition-colors">
                  <input type="radio" name="payment" value={id} defaultChecked={id === 'card'} className="accent-[#8B6914]" />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#8B6914] hover:bg-[#7a5c12] text-white font-semibold text-base"
          >
            {isSubmitting ? 'İşleniyor...' : `Siparişi Tamamla – ${total.toLocaleString('tr-TR')} ₺`}
          </Button>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-2xl p-5 bg-card sticky top-24 space-y-4">
            <h2 className="font-bold">Sipariş Özeti</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[160px]">{product.name} × {quantity}</span>
                  <span className="font-medium flex-shrink-0">
                    {((product.sale_price ?? product.price) * quantity).toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nakliye</span>
              <span className="text-green-600 font-medium">Ücretsiz</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Toplam</span>
              <span className="text-[#8B6914]">{total.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
