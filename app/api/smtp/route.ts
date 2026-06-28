import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { initialSmtpSettings } from '@/lib/bni-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'smtp.json')

async function readSmtp() {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...initialSmtpSettings, ...parsed }
  } catch {
    return initialSmtpSettings
  }
}

export async function GET() {
  const settings = await readSmtp()
  return NextResponse.json({ success: true, data: settings })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Expected SMTP settings object' }, { status: 400 })
    }
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save SMTP settings' }, { status: 500 })
  }
}
