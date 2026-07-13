// Tek seferlik demo veri scripti — her kategoriye ~20 örnek ürün ekler.
// Çalıştırma: node scripts/seed-products.cjs
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// .env.local'i manuel yükle (proje dotenv kullanmıyor)
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}
loadEnvLocal()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TR_MAP = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' }
function slugify(str) {
  return str
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const ADJECTIVES = [
  'Modern', 'Klasik', 'Lüks', 'Şık', 'Kompakt', 'Vintage', 'Minimalist',
  'Country', 'Avangarde', 'Elegan', 'Skandinav', 'Rustik', 'Premium', 'Zarif',
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)]
}

const SPEC_POOL = [
  { key: 'Malzeme', value: pick(['MDF', 'Masif Ahşap', 'Metal Ayaklı MDF', 'Çam Ağacı']) },
]

async function main() {
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('created_at', { ascending: true })

  if (catErr) throw catErr
  if (!categories?.length) {
    console.log('Hiç kategori bulunamadı. Önce admin panelden kategori oluşturun.')
    return
  }

  console.log(`${categories.length} kategori bulundu. Her birine 20 ürün ekleniyor...\n`)

  let totalInserted = 0

  for (const cat of categories) {
    const products = []
    for (let i = 1; i <= 20; i++) {
      const adj = pick(ADJECTIVES)
      const name = `${adj} ${cat.name} ${i}`
      const basePrice = randInt(1500, 35000)
      const hasDiscount = Math.random() < 0.3
      const salePrice = hasDiscount ? Math.round(basePrice * (1 - randInt(10, 30) / 100)) : null
      const stock = Math.random() < 0.1 ? 0 : randInt(1, 45)
      const isFeatured = i <= 2

      const imgSeedBase = `${cat.slug}-${i}`
      const images = [
        `https://picsum.photos/seed/${imgSeedBase}-a/900/900`,
        `https://picsum.photos/seed/${imgSeedBase}-b/900/900`,
      ]

      products.push({
        name,
        slug: `${slugify(name)}-${cat.slug.slice(0, 4)}-${i}`,
        description: `${name}, kaliteli malzemeden üretilmiş, evinize şıklık katacak ${cat.name.toLowerCase()} koleksiyonu ürünüdür. Uzun ömürlü kullanım için özenle tasarlanmıştır.`,
        price: basePrice,
        sale_price: salePrice,
        category_id: cat.id,
        stock,
        is_featured: isFeatured,
        is_active: true,
        images,
        featured_specs: [],
        specs: SPEC_POOL,
        dimensions: [],
        created_at: new Date().toISOString(),
      })
    }

    const { error: insErr, data: inserted } = await supabase.from('products').insert(products).select('id')
    if (insErr) {
      console.error(`✗ ${cat.name}: ${insErr.message}`)
      continue
    }
    totalInserted += inserted?.length ?? 0
    console.log(`✓ ${cat.name}: ${inserted?.length ?? 0} ürün eklendi`)
  }

  console.log(`\nToplam ${totalInserted} ürün eklendi.`)
}

main().catch((e) => {
  console.error('Hata:', e)
  process.exit(1)
})