import { NextResponse } from 'next/server'
import { generateGardenReminders } from '@/lib/ai-scheduler'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const createdReminders = await generateGardenReminders(user.gardenId)

    return NextResponse.json({ success: true, added: createdReminders })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
