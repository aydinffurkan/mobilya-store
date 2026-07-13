import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BlogPostForm from '@/components/admin/BlogPostForm'

export default function NewBlogPostPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/blog" className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Yeni Blog Yazısı</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Yeni bir içerik oluştur</p>
        </div>
      </div>
      <BlogPostForm />
    </div>
  )
}
