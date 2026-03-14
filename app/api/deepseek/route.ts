import { NextResponse } from 'next/server'
import { generateGlobalReminders } from '@/lib/ai-scheduler'

export async function POST() {
  try {
    const createdReminders = await generateGlobalReminders()

    return NextResponse.json({ success: true, added: createdReminders })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
