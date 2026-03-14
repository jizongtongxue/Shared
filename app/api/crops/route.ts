import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gardenId = searchParams.get('gardenId')

  if (!gardenId) {
    return NextResponse.json({ error: 'Garden ID required' }, { status: 400 })
  }

  const crops = await prisma.crop.findMany({
    where: { gardenId: parseInt(gardenId) },
    include: {
      user: { select: { name: true } }
    },
    orderBy: { plantedAt: 'desc' }
  })
  return NextResponse.json(crops)
}

export async function POST(request: Request) {
  try {
    const { name, userId } = await request.json()
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const crop = await prisma.crop.create({
      data: {
        name,
        userId: user.id,
        gardenId: user.gardenId
      }
    })
    return NextResponse.json(crop)
  } catch {
    return NextResponse.json({ error: 'Failed to add crop' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    await prisma.crop.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete crop' }, { status: 500 })
  }
}
