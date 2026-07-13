import { createClient } from '@/lib/supabase/server'
import BlogCarousel from './BlogCarousel'

async function getLatestPosts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, category, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(8)
  return data ?? []
}

export default async function BlogSection() {
  const posts = await getLatestPosts()
  if (posts.length === 0) return null

  return (
    <section className="w-full bg-white py-16 sm:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12">
        <BlogCarousel posts={posts} />
      </div>
    </section>
  )
}
