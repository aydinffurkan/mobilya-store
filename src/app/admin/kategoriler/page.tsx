import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Pencil } from 'lucide-react'
import DeleteCategoryButton from '@/components/admin/DeleteCategoryButton'

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').order('name')
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

function sortHierarchical(categories: Category[]): { category: Category; depth: number }[] {
  const byParent = new Map<string | null, Category[]>()
  for (const c of categories) {
    const key = c.parent_id ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(c)
  }
  const result: { category: Category; depth: number }[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const c of byParent.get(parentId) ?? []) {
      result.push({ category: c, depth })
      walk(c.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories()
  const rows = sortHierarchical(categories)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kategoriler</h1>
          <p className="text-muted-foreground text-sm mt-1">{categories.length} kategori</p>
        </div>
        <Link href="/admin/kategoriler/yeni" className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#8B6914] hover:bg-[#7a5c12] text-white text-sm font-medium transition-colors">
          <Plus size={16} className="mr-1" /> Yeni Kategori
        </Link>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Henüz kategori eklenmedi.</p>
            <Link href="/admin/kategoriler/yeni" className="text-[#8B6914] hover:underline text-sm mt-2 block">
              İlk kategoriyi ekle →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Kategori Adı</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Açıklama</th>
                <th className="text-right px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ category: c, depth }) => (
                <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <span style={{ paddingLeft: depth * 20 }} className="inline-flex items-center gap-1.5">
                      {depth > 0 && <span className="text-muted-foreground">↳</span>}
                      {c.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/kategoriler/${c.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil size={14} />
                        </Button>
                      </Link>
                      <DeleteCategoryButton categoryId={c.id} categoryName={c.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
