import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  const shortId = order?.slice(0, 8).toUpperCase()

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
          <XCircle size={44} className="text-red-500" />
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">Ödeme Başarısız</h1>
      <p className="text-muted-foreground mb-6">
        Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyin.
      </p>

      {shortId && (
        <div className="inline-block bg-secondary rounded-xl px-6 py-3 mb-8">
          <p className="text-xs text-muted-foreground mb-0.5">Sipariş No</p>
          <p className="font-mono font-bold text-lg tracking-widest">#{shortId}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/odeme"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-[#222222] text-white font-medium text-sm"
        >
          Tekrar Dene
        </Link>
        <Link
          href="/sepet"
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border font-medium text-sm"
        >
          Sepete Dön
        </Link>
      </div>
    </div>
  )
}
