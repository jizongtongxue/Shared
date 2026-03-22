import COS from 'cos-nodejs-sdk-v5'

function getEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function extractCosKey(url: string) {
  try {
    const u = new URL(url)
    const key = decodeURIComponent(u.pathname).replace(/^\/+/, '')
    return key || null
  } catch {
    return null
  }
}

export async function deleteCosObjects(urls: string[]) {
  const bucket = process.env.COS_BUCKET
  const region = process.env.COS_REGION
  const secretId = process.env.TENCENT_SECRET_ID
  const secretKey = process.env.TENCENT_SECRET_KEY

  if (!bucket || !region || !secretId || !secretKey) return { deleted: 0 }

  const keys = Array.from(
    new Set(
      urls
        .filter(Boolean)
        .map((u) => extractCosKey(u))
        .filter((k): k is string => Boolean(k))
    )
  )

  if (!keys.length) return { deleted: 0 }

  const cos = new COS({ SecretId: secretId, SecretKey: secretKey })

  const Objects = keys.map((Key) => ({ Key }))

  await new Promise<void>((resolve, reject) => {
    cos.deleteMultipleObject(
      {
        Bucket: bucket,
        Region: region,
        Quiet: true,
        Objects,
      },
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })

  return { deleted: keys.length }
}

