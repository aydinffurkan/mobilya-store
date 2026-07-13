import { NextResponse } from 'next/server'
import { getPaymentMethodsConfig } from '@/lib/actions/payment-methods'

export async function GET() {
  const config = await getPaymentMethodsConfig()
  return NextResponse.json(config)
}
