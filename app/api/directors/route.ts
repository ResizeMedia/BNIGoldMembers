import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { initialDirectors } from '@/lib/bni-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'directors.json')

async function readDirectors() {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : initialDirectors
  } catch {
    // File missing or unreadable → fall back to seed (first run).
    return initialDirectors
  }
}

export async function GET() {
  const directors = await readDirectors()
  return NextResponse.json({ success: true, data: directors })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Expected an array of directors' }, { status: 400 })
    }

    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save directors' }, { status: 500 })
  }
}
