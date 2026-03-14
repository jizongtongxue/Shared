import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const gardens = await prisma.garden.findMany({
      select: {
        id: true,
        name: true,
        inviteCode: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(gardens)
  } catch (error) {
    console.error('Failed to fetch gardens:', error)
    return NextResponse.json({ error: 'Failed to fetch gardens' }, { status: 500 })
  }
}
