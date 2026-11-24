import type { ProductSpec } from '@/types'

export interface RequiredSpecDef {
  key: string
  placeholder: string
  /** Sadece dolap / gardırop ürünlerinde gösterilir */
  wardrobeOnly?: boolean
}

/** Her ürün özellik tablosunda sabit olarak bulunan satırlar (sıra önemli) */
export const ALL_REQUIRED_SPECS: RequiredSpecDef[] = [
  { key: 'Malzeme',      placeholder: 'Masif ahşap, MDF...' },
  { key: 'Renk',         placeholder: 'Ceviz' },
  { key: 'Kapak Adedi',  placeholder: '3 Kapaklı', wardrobeOnly: true },
  { key: 'Temizlik',     placeholder: 'Nemli bezle silin' },
  { key: 'Garanti',      placeholder: '2 yıl' },
]

export function getRequiredSpecs(isWardrobe: boolean): RequiredSpecDef[] {
  return ALL_REQUIRED_SPECS.filter((r) => !r.wardrobeOnly || isWardrobe)
}

// ── Filtrelenebilir özellikler ───────────────────────────────────────────────
// Bu özelliklerin değeri serbest yazılmaz, hazır seçeneklerden (spec_options) seçilir;
// bir üründe birden fazla değer olabilir. Değer, özellik tablosunda "Beyaz, Ceviz"
// şeklinde görünür; filtre için products.filter_tags'e "renk:Beyaz" olarak yazılır.

export interface FilterableSpecDef {
  /** Özellik tablosundaki satır adı ve spec_options.spec_key */
  key: string
  /** URL parametresi ve etiket öneki */
  param: string
  /** Filtre arayüzündeki başlık */
  label: string
}

export const FILTERABLE_SPECS: FilterableSpecDef[] = [
  { key: 'Renk',        param: 'renk',    label: 'Renk' },
  { key: 'Kapak Adedi', param: 'kapak',   label: 'Kapak Adedi' },
  { key: 'Malzeme',     param: 'malzeme', label: 'Malzeme' },
]

export const FILTER_PARAMS = FILTERABLE_SPECS.map((f) => f.param)

export function getFilterableSpec(specKey: string): FilterableSpecDef | undefined {
  const k = norm(specKey)
  return FILTERABLE_SPECS.find((f) => norm(f.key) === k)
}

/** Etiket/URL için güvenli değer: virgül, tırnak, süslü parantez, ters eğik çizgi temizlenir */
export function sanitizeOptionValue(value: string): string {
  return value.replace(/[,"{}\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** "Beyaz, Ceviz" → ['Beyaz', 'Ceviz'] */
export function splitSpecValue(value: string): string[] {
  return value.split(',').map(sanitizeOptionValue).filter(Boolean)
}

export function joinSpecValue(values: string[]): string {
  return values.join(', ')
}

/** URL'deki renk=Beyaz,Ceviz&kapak=3 Kapaklı ... → { renk: [...], kapak: [...] } */
export function parseSpecFilters(get: (param: string) => string | null | undefined): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const param of FILTER_PARAMS) {
    const raw = get(param)
    if (!raw) continue
    const values = splitSpecValue(raw)
    if (values.length) out[param] = values
  }
  return out
}

export const makeTag = (param: string, value: string) => `${param}:${value}`

export function parseTag(tag: string): { param: string; value: string } | null {
  const i = tag.indexOf(':')
  if (i <= 0) return null
  return { param: tag.slice(0, i), value: tag.slice(i + 1) }
}

/** Filtre arayüzü için: gruplanmış seçenekler ve ürün adetleri */
export interface FacetOption {
  value: string
  count: number
  color_hex?: string | null
}
export interface FacetGroup {
  param: string
  label: string
  options: FacetOption[]
}

const norm = (s: string) => s.trim().toLocaleLowerCase('tr-TR')

/** Ürün adı veya kategori zincirinde (kendisi + üst kategoriler) dolap/gardırop geçiyorsa true */
export function isWardrobeProduct(productName: string, categoryTexts: string[]): boolean {
  const re = /dolap|gard[ıi]rop/
  return [productName, ...categoryTexts].some((t) => re.test(norm(t)))
}

/**
 * Zorunlu satırları başa koyar (varsa mevcut değerlerini korur), diğer satırları
 * sonra bırakır. Zorunlu anahtarla aynı adlı yinelenen satırlar birleştirilir.
 * Bu ürüne uygulanmayan koşullu satırlar (ör. dolap olmayan üründe Kapak Adedi)
 * boşsa kaldırılır, doluysa normal satır olarak kalır.
 */
export function withRequiredSpecs(specs: ProductSpec[], isWardrobe = false): ProductSpec[] {
  const required = getRequiredSpecs(isWardrobe)
  const requiredKeys = new Set(required.map((r) => norm(r.key)))
  const head = required.map((r) => {
    const existing = specs.find((s) => norm(s.key) === norm(r.key) && s.value.trim())
    return { key: r.key, value: existing?.value ?? '' }
  })
  const conditionalKeys = new Set(ALL_REQUIRED_SPECS.map((r) => norm(r.key)))
  const rest = specs.filter((s) => {
    const k = norm(s.key)
    if (requiredKeys.has(k)) return false
    if (conditionalKeys.has(k) && !s.value.trim()) return false
    return true
  })
  return [...head, ...rest]
}
