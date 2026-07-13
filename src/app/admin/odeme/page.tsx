import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/crypto/secrets'
import QNBPayManager from '@/components/admin/QNBPayManager'
import type { QNBPaySettings } from '@/components/admin/QNBPayManager'
import KapiOdemeManager from '@/components/admin/KapiOdemeManager'
import HavaleManager from '@/components/admin/HavaleManager'
import type { KapiOdemeSettings, HavaleSettings } from '@/app/admin/odeme/actions'

export default async function AdminPaymentPage() {
  const admin = createAdminClient()

  const [
    { data: qnbpayData },
    { data: kapiData },
    { data: havaleData },
  ] = await Promise.all([
    admin.from('site_settings').select('value').eq('key', 'qnbpay_settings').single(),
    admin.from('site_settings').select('value').eq('key', 'kapi_odeme').single(),
    admin.from('site_settings').select('value').eq('key', 'havale').single(),
  ])

  const qnbpayInitial: QNBPaySettings = {
    enabled:      (qnbpayData?.value as QNBPaySettings | null)?.enabled      ?? false,
    test_mode:    (qnbpayData?.value as QNBPaySettings | null)?.test_mode    ?? true,
    app_id:       (qnbpayData?.value as QNBPaySettings | null)?.app_id       ?? '',
    app_secret:   decryptSecret((qnbpayData?.value as QNBPaySettings | null)?.app_secret    ?? ''),
    merchant_key: decryptSecret((qnbpayData?.value as QNBPaySettings | null)?.merchant_key  ?? ''),
  }

  const kapiInitial: KapiOdemeSettings = {
    enabled:     (kapiData?.value as KapiOdemeSettings | null)?.enabled     ?? false,
    extra_fee:   (kapiData?.value as KapiOdemeSettings | null)?.extra_fee   ?? 0,
    description: (kapiData?.value as KapiOdemeSettings | null)?.description ?? 'Kapıda nakit veya kredi kartı ile ödeme',
  }

  const havaleInitial: HavaleSettings = {
    enabled:     (havaleData?.value as HavaleSettings | null)?.enabled     ?? false,
    description: (havaleData?.value as HavaleSettings | null)?.description ?? 'Sipariş numarasını açıklama olarak yazarak havale yapabilirsiniz.',
    accounts:    (havaleData?.value as HavaleSettings | null)?.accounts    ?? [],
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Ödeme Yöntemleri</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aktif ödeme yöntemleri checkout sayfasında müşterilere sunulur.
        </p>
      </div>

      <QNBPayManager initial={qnbpayInitial} />
      <KapiOdemeManager initial={kapiInitial} />
      <HavaleManager initial={havaleInitial} />
    </div>
  )
}
