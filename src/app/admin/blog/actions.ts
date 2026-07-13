'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth-guard'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export async function uploadBlogCover(formData: FormData): Promise<string> {
  await requireAdmin()
  const file = formData.get('file') as File
  if (!file) throw new Error('Dosya bulunamadı')
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `blog/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const adminClient = createAdminClient()
  const { error } = await adminClient.storage
    .from('product-images')
    .upload(path, buffer, { contentType: file.type, upsert: true })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = adminClient.storage.from('product-images').getPublicUrl(path)
  return publicUrl
}

export interface BlogPostPayload {
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

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

export async function createBlogPost(payload: BlogPostPayload) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const slug = payload.slug || toSlug(payload.title)
  const { error } = await adminClient.from('blog_posts').insert({
    ...payload,
    slug,
    published_at: payload.is_published ? new Date().toISOString() : null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
}

export async function updateBlogPost(id: string, payload: BlogPostPayload) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { data: existing } = await adminClient
    .from('blog_posts').select('is_published, published_at').eq('id', id).single()

  const published_at = payload.is_published && !existing?.published_at
    ? new Date().toISOString()
    : existing?.published_at ?? null

  const { error } = await adminClient.from('blog_posts').update({
    ...payload,
    published_at,
  }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
}

export async function deleteBlogPost(id: string) {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('blog_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
}
