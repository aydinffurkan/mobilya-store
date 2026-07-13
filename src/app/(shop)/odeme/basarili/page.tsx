import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  const shortId = order?.slice(0, 8).toUpperCase()

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
          <CheckCircle2 size={44} className="text-green-600" />
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">Ödemeniz Alındı!</h1>
      <p className="text-muted-foreground mb-6">
        Siparişiniz başarıyla tamamlandı. Kargo bilgileriniz e-posta adresinize iletilecek.
      </p>

      {shortId && (
        <div className="inline-block bg-secondary rounded-xl px-6 py-3 mb-8">
          <p className="text-xs text-muted-foreground mb-0.5">Sipariş No</p>
          <p className="font-mono font-bold text-lg tracking-widest">#{shortId}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/hesabim"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#222222] text-white font-medium text-sm"
        >
          Siparişlerimi Gör
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border font-medium text-sm"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
