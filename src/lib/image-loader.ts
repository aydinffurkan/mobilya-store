/**
 * next/image için özel loader.
 *
 * Vercel'in Image Optimization kotası dolduğunda /_next/image 402
 * (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) döndürüyordu. Optimizasyonu
 * ücretsiz images.weserv.nl CDN'ine devrediyoruz: resize + webp korunur,
 * Vercel kotası devre dışı kalır.
 *
 * Tüm görsel kaynaklarımız uzak URL (Supabase Storage, picsum) olduğundan
 * global loader güvenli — statik/relative src yok.
 */
type LoaderArgs = { src: string; width: number; quality?: number }

export default function weservLoader({ src, width, quality }: LoaderArgs): string {
  // Tüm görsel kaynaklarımız uzak public URL (Supabase Storage, picsum);
  // weserv bunları dev dahil her ortamda işleyebilir. Böylece dev ve prod
  // aynı davranır ve Next'in "loader width'i kullanmıyor" uyarısı oluşmaz.

  // weserv https kaynakları için "ssl:" öneki ister (protokol atılır).
  const stripped = src.replace(/^https:\/\//, 'ssl:').replace(/^http:\/\//, '')

  const params = new URLSearchParams({
    url: stripped,
    w: String(width),
    q: String(quality ?? 75),
    output: 'webp',
  })

  return `https://images.weserv.nl/?${params.toString()}`
}