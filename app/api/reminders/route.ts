import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gardenId = searchParams.get('gardenId')

  if (!gardenId) {
    return NextResponse.json({ error: 'Garden ID required' }, { status: 400 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const reminders = await prisma.reminder.findMany({
    where: {
      gardenId: parseInt(gardenId),
      OR: [
        { isDone: false },
        {
          AND: [
            { isDone: true },
            { updatedAt: { gte: todayStart } }
          ]
        }
      ]
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(reminders)
}

export async function POST(request: Request) {
  try {
    const { content, userId } = await request.json()
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const reminder = await prisma.reminder.create({
      data: {
        content,
        userId: user.id,
        gardenId: user.gardenId
      }
    })
    return NextResponse.json(reminder)
  } catch {
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
  } catch {
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}
