import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    deployTag: 'DEPLOY-2026-03-21-01',
    railwayCommit: process.env.RAILWAY_GIT_COMMIT_SHA || null,
    nodeEnv: process.env.NODE_ENV || null,
    timestamp: new Date().toISOString(),
  })
}

