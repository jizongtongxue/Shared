import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  const reminders = await prisma.reminder.findMany({
    where: { userId: parseInt(userId) },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(reminders)
}

export async function POST(request: Request) {
  try {
    const { content, userId } = await request.json()
    const reminder = await prisma.reminder.create({
      data: {
        content,
        userId: parseInt(userId)
      }
    })
    return NextResponse.json(reminder)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add reminder' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, isDone } = await request.json()
    const reminder = await prisma.reminder.update({
      where: { id: parseInt(id) },
      data: { isDone }
    })
    return NextResponse.json(reminder)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}
