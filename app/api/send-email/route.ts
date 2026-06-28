import { NextRequest, NextResponse } from 'next/server'
import type { SmtpSettings } from '@/lib/bni-data'
import { buildTransporter, getSmtpErrorMessage, isSmtpConfigured, sendMail } from '@/lib/send-mail'

export const runtime = 'nodejs'

interface SendEmailPayload {
  smtpSettings?: SmtpSettings
  testOnly?: boolean
  email?: {
    to?: string
    subject?: string
    body?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendEmailPayload
    const settings = body.smtpSettings
    const email = body.email

    if (!isSmtpConfigured(settings)) {
      return NextResponse.json(
        { success: false, error: 'Configurarea SMTP este incompleta' },
        { status: 400 }
      )
    }

    if (body.testOnly) {
      await buildTransporter(settings).verify()
      return NextResponse.json({ success: true, message: 'Conexiunea SMTP este valida' })
    }

    if (!email?.to || !email.subject || !email.body) {
      return NextResponse.json(
        { success: false, error: 'Emailul nu are destinatar, subiect sau continut' },
        { status: 400 }
      )
    }

    const info = await sendMail(settings, { to: email.to, subject: email.subject, body: email.body })
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getSmtpErrorMessage(error) },
      { status: 500 }
    )
  }
}
