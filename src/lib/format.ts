const TR_TZ = 'Europe/Istanbul'

/**
 * Tarihi Türkiye saat dilimine sabitleyerek biçimlendirir.
 *
 * timeZone sabitlenmezse, client bileşenlerde sunucu (Vercel/UTC) ile tarayıcı
 * (TR/UTC+3) gün sınırına yakın tarihlerde farklı gün üretir ve hydration
 * uyuşmazlığına (React #418) yol açar. Tarih gösteren tüm client bileşenlerde
 * bunu kullanın.
 *
 * @param dateStr ISO tarih string'i
 * @param opts    Intl.DateTimeFormat seçenekleri (varsayılan: locale kısa biçim)
 */
export function formatDateTR(
  dateStr: string,
  opts: Intl.DateTimeFormatOptions = {},
): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', { ...opts, timeZone: TR_TZ })
}