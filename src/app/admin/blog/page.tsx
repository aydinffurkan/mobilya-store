import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Plus, Pencil, Newspaper } from 'lucide-react'
import DeleteBlogPostButton from './DeleteBlogPostButton'

async function getBlogPosts() {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('blog_posts')
    .select('id, title, slug, category, is_published, published_at, created_at, read_time')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminBlogPage() {
  const posts = await getBlogPosts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Blog Yazıları</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{posts.length} yazı</p>
        </div>
        <Link
          href="/admin/blog/yeni"
          className="flex items-center gap-2 px-4 py-2 bg-[#222222] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Yeni Yazı</span>
          <span className="sm:hidden">Yeni</span>
        </Link>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Newspaper size={36} strokeWidth={1.5} />
            <p className="text-sm">Henüz blog yazısı yok.</p>
            <Link href="/admin/blog/yeni" className="text-sm text-[#222222] font-medium hover:underline">
              İlk yazıyı oluştur →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground font-medium">
                  <th className="px-5 py-3">Başlık</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Kategori</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3 hidden md:table-cell">Tarih</th>
                  <th className="px-5 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm truncate max-w-[240px]">{post.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[240px]">{post.slug}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">{post.category || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${post.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {post.is_published ? 'Yayında' : 'Taslak'}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Düzenle"
                        >
                          <Pencil size={15} />
                        </Link>
                        <DeleteBlogPostButton id={post.id} title={post.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
