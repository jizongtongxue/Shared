import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const crops = await prisma.crop.findMany({
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { plantedAt: 'desc' }
  })
  return NextResponse.json(crops)
}

export async function POST(request: Request) {
  try {
    const { name, userId } = await request.json()
    const crop = await prisma.crop.create({
      data: {
        name,
        userId: parseInt(userId)
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
