import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductSpec, SpecOption } from '@/types'
import {
  getFilterableSpec,
  joinSpecValue,
  makeTag,
  sanitizeOptionValue,
  splitSpecValue,
} from '@/lib/productSpecs'

const norm = (s: string) => s.trim().toLocaleLowerCase('tr-TR')

export async function getSpecOptions(client: SupabaseClient): Promise<SpecOption[]> {
  try {
    const { data } = await client
      .from('spec_options')
      .select('id, spec_key, value, color_hex, sort_order')
      .order('sort_order')
      .order('value')
    return (data as SpecOption[]) ?? []
  } catch {
    return []
  }
}

/**
 * Özellik satırlarından filtre etiketlerini çıkarır.
 * - Değerler hazır seçeneklerle büyük/küçük harf gözetmeden eşleştirilir (yazım tutarlı kalır)
 * - Listede olmayan değerler spec_options'a eklenir
 * Dönen specs, değerleri kanonik yazımla yeniden birleştirilmiş halidir.
 * Tablo henüz yoksa (migration bekliyor) hata vermeden ham değerlerle devam eder.
 */
export async function buildFilterTags(
  client: SupabaseClient,
  specs: ProductSpec[]
): Promise<{ specs: ProductSpec[]; tags: string[] }> {
  const options = await getSpecOptions(client)
  const byKey = new Map<string, Map<string, string>>()
  for (const o of options) {
    const k = norm(o.spec_key)
    if (!byKey.has(k)) byKey.set(k, new Map())
    byKey.get(k)!.set(norm(o.value), o.value)
  }

  const toInsert: { spec_key: string; value: string; sort_order: number }[] = []
  const tags = new Set<string>()

  const nextSpecs = specs.map((spec) => {
    const def = getFilterableSpec(spec.key)
    if (!def) return spec

    const known = byKey.get(norm(def.key)) ?? new Map<string, string>()
    const canonical: string[] = []
    for (const raw of splitSpecValue(spec.value)) {
      const hit = known.get(norm(raw))
      const value = hit ?? sanitizeOptionValue(raw)
      if (!hit) {
        known.set(norm(value), value)
        byKey.set(norm(def.key), known)
        toInsert.push({ spec_key: def.key, value, sort_order: known.size })
      }
      if (!canonical.includes(value)) canonical.push(value)
      tags.add(makeTag(def.param, value))
    }
    return { ...spec, value: joinSpecValue(canonical) }
  })

  if (toInsert.length > 0) {
    // Çakışma (yarış durumu) ya da tablo yoksa hata döner; etiketleri etkilemez, yoksay
    await client.from('spec_options').insert(toInsert)
  }

  return { specs: nextSpecs, tags: [...tags] }
}
