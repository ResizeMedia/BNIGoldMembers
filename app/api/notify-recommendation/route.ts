import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Director, SmtpSettings, getDirectorGroups, getDirectorRegions, initialDirectors, initialSmtpSettings } from '@/lib/bni-data'
import { isSmtpConfigured, sendMail } from '@/lib/send-mail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const dataDir = path.join(process.cwd(), 'data')

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir, file), 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

interface NotifyPayload {
  recommendation?: { from?: string; to?: string; domain?: string; group?: string }
  region?: string
  template?: { subject?: string; body?: string }
}

function render(text: string, values: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] || '')
}

export async function POST(request: NextRequest) {
  try {
    const { recommendation, region, template } = await request.json() as NotifyPayload

    if (!recommendation?.group || !template?.subject || !template?.body) {
      return NextResponse.json({ success: false, error: 'Payload incomplet' }, { status: 400 })
    }

    const smtp = await readJson<SmtpSettings>('smtp.json', initialSmtpSettings)
    if (!isSmtpConfigured(smtp)) {
      // No SMTP configured on the server → silently skip, never block the submission.
      return NextResponse.json({ success: true, sent: 0, reason: 'smtp_not_configured' })
    }

    const directors = await readJson<Director[]>('directors.json', initialDirectors)

    // Scope-based: anyone who launch-consults this group OR is executive over its region.
    // Covers launch consultants, executives, and dual-role directors.
    const recipients = directors.filter((director) => {
      if (!director.email) return false
      const launches = getDirectorGroups(director).some((g) => g.toLowerCase() === recommendation.group!.toLowerCase())
      const oversees = region ? getDirectorRegions(director).includes(region) : false
      return launches || oversees
    })

    // Dedupe by email (a person could match twice).
    const seen = new Set<string>()
    const unique = recipients.filter((director) => {
      const key = director.email.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    let sent = 0
    await Promise.all(unique.map(async (director) => {
      const values = {
        directorName: director.name,
        recommenderName: recommendation.from || '',
        recommendedName: recommendation.to || '',
        domain: recommendation.domain || '',
        group: recommendation.group || '',
      }
      try {
        await sendMail(smtp, {
          to: director.email,
          subject: render(template.subject!, values),
          body: render(template.body!, values),
        })
        sent += 1
      } catch {
        // Best-effort per recipient; one failure must not break the others.
      }
    }))

    return NextResponse.json({ success: true, sent })
  } catch {
    return NextResponse.json({ success: false, error: 'Notificarea a esuat' }, { status: 500 })
  }
}
