import { createAdminClient } from '@/lib/supabase/admin'

export interface PaymentMethodsConfig {
  card: boolean
  cod: boolean
  codFee: number
  codDescription: string
  transfer: boolean
  transferDescription: string
  transferAccounts: {
    id: string
    bank_name: string
    account_name: string
    iban: string
    branch: string
  }[]
}

export async function getPaymentMethodsConfig(): Promise<PaymentMethodsConfig> {
  const admin = createAdminClient()
  const [{ data: qnb }, { data: kapi }, { data: havale }] = await Promise.all([
    admin.from('site_settings').select('value').eq('key', 'qnbpay_settings').single(),
    admin.from('site_settings').select('value').eq('key', 'kapi_odeme').single(),
    admin.from('site_settings').select('value').eq('key', 'havale').single(),
  ])

  return {
    card:                (qnb?.value   as { enabled?: boolean } | null)?.enabled      ?? false,
    cod:                 (kapi?.value  as { enabled?: boolean } | null)?.enabled      ?? false,
    codFee:              (kapi?.value  as { extra_fee?: number } | null)?.extra_fee   ?? 0,
    codDescription:      (kapi?.value  as { description?: string } | null)?.description ?? '',
    transfer:            (havale?.value as { enabled?: boolean } | null)?.enabled     ?? false,
    transferDescription: (havale?.value as { description?: string } | null)?.description ?? '',
    transferAccounts:    (havale?.value as { accounts?: PaymentMethodsConfig['transferAccounts'] } | null)?.accounts ?? [],
  }
}
