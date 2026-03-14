import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    const checkIn = await prisma.checkIn.create({
      data: {
        userId: parseInt(userId)
      }
    })
    return NextResponse.json(checkIn)
  } catch {
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 })
  }
}

export async function GET() {
  const lastCheckIn = await prisma.checkIn.findFirst({
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(lastCheckIn)
}
