import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, code } = await request.json()

    if (!code || !name) {
      return NextResponse.json({ error: '请填写名字和邀请码' }, { status: 400 })
    }

    // 1. Find or Create Garden based on invite code
    let garden = await prisma.garden.findUnique({
      where: { inviteCode: code }
    })

    if (!garden) {
      garden = await prisma.garden.create({
        data: { 
          inviteCode: code,
          name: `${name}的菜园` // Initial default name
        }
      })
    }

    // 2. Find or Create User and link to this garden
    let user = await prisma.user.findUnique({
      where: { name }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { 
          name,
          gardenId: garden.id
        }
      })
    } else {
      // Update user's garden if they already exist (optional, depends on policy)
      user = await prisma.user.update({
        where: { id: user.id },
        data: { gardenId: garden.id }
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
