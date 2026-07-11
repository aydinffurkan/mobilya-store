import { NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function ok<T>(data: T, meta?: object): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, { headers: CORS_HEADERS })
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201, headers: CORS_HEADERS })
}

export function notFound(message = 'Bulunamadı'): NextResponse {
  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message } }, { status: 404, headers: CORS_HEADERS })
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message } }, { status: 400, headers: CORS_HEADERS })
}

export function tooManyRequests(retryAfter: number, message = 'Çok fazla istek, lütfen biraz sonra tekrar deneyin'): NextResponse {
  return NextResponse.json(
    { success: false, error: { code: 'RATE_LIMITED', message } },
    { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': String(retryAfter) } },
  )
}

export function corsOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export function parseIntParam(val: string | null, fallback: number): number {
  const n = Number(val)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}
