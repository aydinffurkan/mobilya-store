import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Clock } from 'lucide-react'

async function getPublishedPosts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, author_name, category, tags, read_time, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
  return data ?? []
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-[1360px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222]">Blog</h1>
        <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Mobilya, dekorasyon ve ev yaşamı hakkında yazılar</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Henüz yazı yok</p>
          <p className="text-sm mt-1">Yakında içerikler eklenecek.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[16/9] bg-neutral-100 overflow-hidden">
                {post.cover_image_url ? (
                  <Image
                    src={post.cover_image_url}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                  </div>
                )}
                {post.category && (
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full text-[#222222]">
                    {post.category}
                  </span>
                )}
              </div>

              <div className="flex flex-col flex-1 p-5">
                <h2 className="font-bold text-[#222222] text-base sm:text-lg leading-snug line-clamp-2 mb-2 group-hover:text-neutral-600 transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                )}
                <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {post.read_time} dk okuma
                  </span>
                  {post.published_at && (
                    <span>{new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
