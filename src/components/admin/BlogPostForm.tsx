'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createBlogPost, updateBlogPost, uploadBlogCover, BlogPostPayload } from '@/app/admin/blog/actions'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string | null
  author_name: string
  category: string
  tags: string[]
  read_time: number
  is_published: boolean
}

interface Props {
  post?: BlogPost
}

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function BlogPostForm({ post }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [title,       setTitle]       = useState(post?.title ?? '')
  const [slug,        setSlug]        = useState(post?.slug ?? '')
  const [excerpt,     setExcerpt]     = useState(post?.excerpt ?? '')
  const [content,     setContent]     = useState(post?.content ?? '')
  const [coverUrl,    setCoverUrl]    = useState(post?.cover_image_url ?? '')
  const [author,      setAuthor]      = useState(post?.author_name ?? 'Admin')
  const [category,    setCategory]    = useState(post?.category ?? '')
  const [tagsInput,   setTagsInput]   = useState((post?.tags ?? []).join(', '))
  const [readTime,    setReadTime]    = useState(post?.read_time ?? 3)
  const [published,   setPublished]   = useState(post?.is_published ?? false)

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!post) setSlug(toSlug(v))
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await uploadBlogCover(fd)
      setCoverUrl(url)
      toast.success('Görsel yüklendi')
    } catch (err: any) {
      toast.error(err.message ?? 'Görsel yüklenemedi')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Başlık zorunlu'); return }
    setSaving(true)
    const payload: BlogPostPayload = {
      title: title.trim(),
      slug: slug.trim() || toSlug(title),
      excerpt: excerpt.trim(),
      content: content.trim(),
      cover_image_url: coverUrl || null,
      author_name: author.trim() || 'Admin',
      category: category.trim(),
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      read_time: readTime,
      is_published: published,
    }
    try {
      if (post) {
        await updateBlogPost(post.id, payload)
        toast.success('Yazı güncellendi')
      } else {
        await createBlogPost(payload)
        toast.success('Yazı oluşturuldu')
        router.push('/admin/blog')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">

      {/* Kapak Görseli */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-4">Kapak Görseli</h2>
        {coverUrl ? (
          <div className="relative w-full aspect-[16/6] rounded-xl overflow-hidden border border-border">
            <Image src={coverUrl} alt="Kapak" fill className="object-cover" />
            <button
              type="button"
              onClick={() => setCoverUrl('')}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center w-full aspect-[16/6] border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            {uploading ? <Loader2 size={24} className="animate-spin text-muted-foreground" /> : <ImagePlus size={24} className="text-muted-foreground" />}
            <span className="text-sm text-muted-foreground mt-2">{uploading ? 'Yükleniyor...' : 'Kapak görseli ekle'}</span>
          </label>
        )}
      </div>

      {/* Temel Bilgiler */}
      <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-sm">Temel Bilgiler</h2>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Başlık *</label>
          <input
            value={title} onChange={e => handleTitleChange(e.target.value)}
            placeholder="Yazı başlığı" required
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Slug (URL)</label>
          <input
            value={slug} onChange={e => setSlug(e.target.value)}
            placeholder="yazi-basligi"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Özet</label>
          <textarea
            value={excerpt} onChange={e => setExcerpt(e.target.value)}
            placeholder="Kısa açıklama (liste ve meta description için)"
            rows={2}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Yazar</label>
            <input
              value={author} onChange={e => setAuthor(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kategori</label>
            <input
              value={category} onChange={e => setCategory(e.target.value)}
              placeholder="Dekorasyon, Tasarım..."
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Okuma süresi (dk)</label>
            <input
              type="number" min={1} max={60}
              value={readTime} onChange={e => setReadTime(Number(e.target.value))}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Etiketler (virgülle ayır)</label>
          <input
            value={tagsInput} onChange={e => setTagsInput(e.target.value)}
            placeholder="mobilya, dekorasyon, ev"
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]/20"
          />
        </div>
      </div>

      {/* İçerik */}
      <div className="bg-white border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm mb-4">İçerik</h2>
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Yazı içeriğini buraya girin. Paragrafları boş satırla ayırın."
          rows={20}
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#222222]/20 font-mono leading-relaxed"
        />
        <p className="text-xs text-muted-foreground mt-2">Paragrafları boş satırla ayırın. **kalın**, *italik* yazım desteklenir.</p>
      </div>

      {/* Yayınla */}
      <div className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setPublished(p => !p)}
            className={`relative w-11 h-6 rounded-full transition-colors ${published ? 'bg-[#222222]' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${published ? 'translate-x-5' : ''}`} />
          </div>
          <div>
            <p className="text-sm font-medium">{published ? 'Yayında' : 'Taslak'}</p>
            <p className="text-xs text-muted-foreground">{published ? 'Ziyaretçiler görebilir' : 'Sadece adminler görebilir'}</p>
          </div>
        </label>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-secondary transition-colors">
            İptal
          </button>
          <button
            type="submit" disabled={saving}
            className="px-5 py-2 text-sm bg-[#222222] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {post ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>

    </form>
  )
}
