import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const VALID_INVITE_CODE = 'LAOXIANG666'

export async function POST(request: Request) {
  try {
    const { name, code } = await request.json()

    if (code !== VALID_INVITE_CODE) {
      return NextResponse.json(
        { error: '无效的邀请码' },
        { status: 401 }
      )
    }

    let user = await prisma.user.findUnique({
      where: { name },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { name },
      })
    }

    // In a real app, we would set a session cookie here.
    // For simplicity, we'll return the user object and store ID in localStorage on client.
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
