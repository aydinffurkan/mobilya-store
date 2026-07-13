import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import BlogPostForm from '@/components/admin/BlogPostForm'

async function getPost(id: string) {
  const adminClient = createAdminClient()
  const { data } = await adminClient.from('blog_posts').select('*').eq('id', id).single()
  return data
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blog" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Yazıyı Düzenle</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-[300px]">{post.title}</p>
        </div>
      </div>
      <BlogPostForm post={post} />
    </div>
  )
}
