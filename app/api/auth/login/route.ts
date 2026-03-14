import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, code, action } = await request.json()

    if (!code || !name) {
      return NextResponse.json({ error: '请填写名字和邀请码' }, { status: 400 })
    }

    // Find the garden first
    const garden = await prisma.garden.findUnique({
      where: { inviteCode: code }
    })

    if (action === 'register') {
      // 1. Check if garden exists
      if (!garden) {
        return NextResponse.json({ error: '邀请码无效，请联系管理员' }, { status: 400 })
      }

      // 2. Check if user already exists in this garden
      const existingUser = await prisma.user.findFirst({
        where: { 
          name,
          gardenId: garden.id
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: '该名字在此菜园中已被注册' }, { status: 400 })
      }

      // 3. Create user
      const user = await prisma.user.create({
        data: { 
          name,
          gardenId: garden.id
        }
      })
      return NextResponse.json({ user })

    } else {
      // Login Action
      if (!garden) {
        return NextResponse.json({ error: '邀请码错误' }, { status: 400 })
      }

      const user = await prisma.user.findFirst({
        where: { 
          name,
          gardenId: garden.id
        }
      })

      if (!user) {
        return NextResponse.json({ error: '该名字未在此菜园注册' }, { status: 404 })
      }

      return NextResponse.json({ user })
    }

  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: '认证失败' }, { status: 500 })
  }
}
