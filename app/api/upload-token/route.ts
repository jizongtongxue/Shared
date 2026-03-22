import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCredential, getPolicy } from 'qcloud-cos-sts'

export const dynamic = 'force-dynamic'

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function inferExt(filename?: string | null, contentType?: string | null) {
  const lower = (filename || '').toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot !== -1 && dot < lower.length - 1) return lower.slice(dot + 1)
  const ct = (contentType || '').toLowerCase()
  if (ct === 'image/jpeg') return 'jpg'
  if (ct === 'image/png') return 'png'
  if (ct === 'image/webp') return 'webp'
  if (ct === 'image/gif') return 'gif'
  if (ct === 'video/mp4') return 'mp4'
  if (ct === 'video/quicktime') return 'mov'
  return 'bin'
}

function buildKey(ext: string, contentType?: string | null) {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const id = crypto.randomUUID()
  const prefix = contentType?.toLowerCase().startsWith('video/') ? 'videos' : 'images'
  return `shared-garden/${prefix}/${yyyy}/${mm}/${dd}/${id}.${ext}`
}

export async function POST(request: Request) {
  try {
    const { userId, filename, contentType, fileSize } = await request.json().catch(() => ({}))

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(String(userId)) } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bucket = getEnv('COS_BUCKET')
    const region = getEnv('COS_REGION')
    const publicBaseUrl = getEnv('COS_PUBLIC_BASE_URL').replace(/\/$/, '')

    const ctLower = (contentType || '').toLowerCase()
    const isVideo = ctLower.startsWith('video/')

    if (typeof fileSize === 'number' && Number.isFinite(fileSize)) {
      const maxVideoBytes = 500 * 1024 * 1024
      const maxImageBytes = 20 * 1024 * 1024
      if (isVideo && fileSize > maxVideoBytes) {
        return NextResponse.json({ error: 'Video too large (max 500MB)' }, { status: 413 })
      }
      if (!isVideo && fileSize > maxImageBytes) {
        return NextResponse.json({ error: 'Image too large (max 20MB)' }, { status: 413 })
      }
    }

    const ext = inferExt(filename, contentType)
    const key = buildKey(ext, contentType)

    const policy = getPolicy([
      {
        action: [
          'name/cos:PutObject',
          'name/cos:HeadObject',
          'name/cos:InitiateMultipartUpload',
          'name/cos:UploadPart',
          'name/cos:CompleteMultipartUpload',
          'name/cos:AbortMultipartUpload',
          'name/cos:ListMultipartUploads',
          'name/cos:ListParts',
        ],
        bucket,
        region,
        prefix: key,
      },
    ])

    const durationSeconds = isVideo
      ? 7200
      : 1800

    const { credentials, startTime, expiredTime } = await getCredential({
      secretId: getEnv('TENCENT_SECRET_ID'),
      secretKey: getEnv('TENCENT_SECRET_KEY'),
      durationSeconds,
      policy,
    })

    return NextResponse.json({
      bucket,
      region,
      key,
      contentType: contentType || null,
      publicUrl: `${publicBaseUrl}/${key}`,
      credentials: {
        tmpSecretId: credentials?.tmpSecretId,
        tmpSecretKey: credentials?.tmpSecretKey,
        sessionToken: credentials?.sessionToken,
        startTime,
        expiredTime,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to create upload token' }, { status: 500 })
  }
}
