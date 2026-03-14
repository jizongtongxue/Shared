import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gardenId = searchParams.get('gardenId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20

    if (!gardenId) {
      return NextResponse.json({ error: 'Garden ID required' }, { status: 400 })
    }

    const posts = await prisma.post.findMany({
      where: { gardenId: parseInt(gardenId) },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { content, imageUrl, videoUrl, userId } = await request.json()
    
    if (!userId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl,
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
