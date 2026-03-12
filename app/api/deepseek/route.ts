import { NextResponse } from 'next/server'
import { generateRemindersForUser } from '@/lib/ai-scheduler'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    const uid = parseInt(userId)

    const createdReminders = await generateRemindersForUser(uid)

    return NextResponse.json({ success: true, added: createdReminders })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
