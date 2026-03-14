import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const reminders = await prisma.reminder.findMany({
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
