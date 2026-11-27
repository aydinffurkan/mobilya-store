const TR_MAP: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
  Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u',
}

/** Türkçe karakterleri dönüştürüp URL-güvenli slug üretir: "Gardırop Takımı" → "gardirop-takimi" */
export function slugifyTr(str: string): string {
  return str
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Route param'ından gelen slug URL-encoded olabilir ("gard%C4%B1rop") — çözülmüş halini döner */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}
