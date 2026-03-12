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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { userId: parseInt(userId) },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(lastCheckIn)
}
