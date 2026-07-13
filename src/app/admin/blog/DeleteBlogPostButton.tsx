'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteBlogPost } from './actions'

export default function DeleteBlogPostButton({ id, title }: { id: string; title: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`"${title}" yazısını silmek istediğinize emin misiniz?`)) return
    setLoading(true)
    try {
      await deleteBlogPost(id)
      toast.success('Yazı silindi')
    } catch {
      toast.error('Silinemedi')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
      title="Sil"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  )
}
