import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import type { SmtpSettings } from '@/lib/bni-data'

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

function plainToHtml(text: string): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#1f2326;line-height:1.6">${
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
  }</body></html>`
}

function getSmtpErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Nu am putut trimite emailul'
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  const address = typeof error === 'object' && error && 'address' in error ? String(error.address) : ''
  const port = typeof error === 'object' && error && 'port' in error ? String(error.port) : ''

  if (code === 'ECONNREFUSED') {
    return `Conexiunea SMTP a fost refuzata${address && port ? ` (${address}:${port})` : ''}. Gmail: foloseste port 587, SSL/TLS dezactivat. Outlook: smtp.office365.com, port 587. Hosterion: lyssa.hosterion.net, port 465, SSL/TLS activ.`
  }

  if (code === 'ENETUNREACH' || code === 'EHOSTUNREACH') {
    return 'Serverul nu poate ajunge la adresa SMTP. Gmail: smtp.gmail.com port 587. Outlook: smtp.office365.com port 587.'
  }

  if (message.includes('Hostname/IP does not match certificate')) {
    return 'Certificatul SMTP nu se potriveste cu hostul introdus.'
  }

  if (code === 'ETIMEDOUT') {
    return 'Conexiunea SMTP expira. Portul poate fi blocat de hosting. Incearca port 587 in loc de 465.'
  }

  if (code === 'EAUTH') {
    return 'Autentificarea SMTP a esuat. Gmail: foloseste App Password (16 caractere) din Google Account → Security → App passwords. Outlook: parola contului sau app password daca MFA e activ.'
  }

  return message
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendEmailPayload
    const settings = body.smtpSettings
    const email = body.email

    const isLocalRelay = settings?.host === 'localhost' || settings?.host === '127.0.0.1'

    if (!settings?.host || !settings.port || (!isLocalRelay && (!settings.username || !settings.password))) {
      return NextResponse.json(
        { success: false, error: 'Configurarea SMTP este incompleta' },
        { status: 400 }
      )
    }

    const port = Number(settings.port)
    const isStartTls = !settings.secure && port === 587

    const transporter = nodemailer.createTransport({
      host: settings.host,
      port,
      secure: settings.secure,
      ...(isStartTls ? { requireTLS: true } : {}),
      ...(!isLocalRelay && settings.username ? {
        auth: {
          user: settings.username,
          pass: settings.password,
        },
      } : {}),
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    })

    if (body.testOnly) {
      await transporter.verify()
      return NextResponse.json({
        success: true,
        message: 'Conexiunea SMTP este valida',
      })
    }

    if (!email?.to || !email.subject || !email.body) {
      return NextResponse.json(
        { success: false, error: 'Emailul nu are destinatar, subiect sau continut' },
        { status: 400 }
      )
    }

    const fromEmail = settings.fromEmail || settings.username
    const info = await transporter.sendMail({
      from: settings.fromName ? `"${settings.fromName}" <${fromEmail}>` : fromEmail,
      to: email.to,
      replyTo: settings.replyTo || undefined,
      subject: email.subject,
      text: email.body,
      html: plainToHtml(email.body),
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error) {
    const message = getSmtpErrorMessage(error)

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
