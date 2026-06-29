import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { initialPriorityDomains } from '@/lib/bni-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'priority-domains.json')

async function readPriorityDomains() {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : initialPriorityDomains
  } catch {
    return initialPriorityDomains
  }
}

export async function GET() {
  const data = await readPriorityDomains()
  return NextResponse.json({ success: true, data })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Expected an array' }, { status: 400 })
    }
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 })
  }
}
