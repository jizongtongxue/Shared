import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const checkIn = await prisma.checkIn.create({
      data: {
        userId: user.id,
        gardenId: user.gardenId
      }
    })
    return NextResponse.json(checkIn)
  } catch {
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gardenId = searchParams.get('gardenId')

  if (!gardenId) {
    return NextResponse.json({ error: 'Garden ID required' }, { status: 400 })
  }

  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { gardenId: parseInt(gardenId) },
    include: {
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(lastCheckIn)
}
