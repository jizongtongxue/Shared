import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { deleteCosObjects } from '@/lib/cos-delete'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing post ID' }, { status: 400 })
    }

    const postId = parseInt(id)
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { imageUrls: true, videoUrl: true }
    })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const urls = [...(post.imageUrls || []), ...(post.videoUrl ? [post.videoUrl] : [])]
    await deleteCosObjects(urls)

    await prisma.post.delete({ where: { id: postId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
