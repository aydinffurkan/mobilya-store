import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Clock, ArrowLeft, Tag } from 'lucide-react'

async function getPost(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data
}

function renderContent(content: string) {
  return content.split(/\n\n+/).map((para, i) => {
    const trimmed = para.trim()
    if (!trimmed) return null
    // Escape HTML entities first to prevent XSS, then apply safe markdown substitutions
    const escaped = trimmed
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const html = escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
    return <p key={i} className="mb-5 leading-relaxed text-neutral-700" dangerouslySetInnerHTML={{ __html: html }} />
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-[800px] mx-auto">
      {/* Back */}
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#222222] transition-colors mb-6">
        <ArrowLeft size={14} />
        Blog
      </Link>

      {/* Category + meta */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {post.category && (
          <span className="text-xs font-medium bg-neutral-100 text-[#222222] px-3 py-1 rounded-full">
            {post.category}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} />
          {post.read_time} dk okuma
        </span>
        {post.published_at && (
          <span className="text-xs text-muted-foreground">
            {new Date(post.published_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#222222] leading-tight mb-4">
        {post.title}
      </h1>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-lg text-muted-foreground mb-6 leading-relaxed border-l-4 border-neutral-200 pl-4">
          {post.excerpt}
        </p>
      )}

      {/* Author */}
      <div className="flex items-center gap-2 mb-8 pb-8 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-600">
          {post.author_name?.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-[#222222]">{post.author_name}</span>
      </div>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8">
          <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" priority />
        </div>
      )}

      {/* Content */}
      <div className="prose-like text-base">
        {renderContent(post.content)}
      </div>

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex items-center flex-wrap gap-2">
            <Tag size={14} className="text-muted-foreground" />
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Back to blog */}
      <div className="mt-12 pt-8 border-t border-border">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#222222] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={14} />
          Tüm Yazılar
        </Link>
      </div>
    </div>
  )
}
