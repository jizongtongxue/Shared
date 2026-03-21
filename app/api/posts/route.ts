import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gardenId = searchParams.get('gardenId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20

    const where: Prisma.PostWhereInput = {}
    if (gardenId && gardenId !== 'all') {
      where.gardenId = parseInt(gardenId)
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        garden: { select: { inviteCode: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })
    const response = NextResponse.json(posts)
    response.headers.set('x-version', '1.0.1')
    return response
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { content, imageUrls, videoUrl, userId } = await request.json()
    
    if (!userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const post = await prisma.post.create({
      data: {
        content,
        imageUrls: imageUrls || [],
        videoUrl,
        userId: user.id,
        gardenId: user.gardenId
      }
    })

    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

// Handler for deleting a post
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      const body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing post ID' }, { status: 400 })
    }
    await prisma.post.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
