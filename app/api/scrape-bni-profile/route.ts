import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BNI_API = 'https://www.bniconnectglobal.com/bnicms/v3/frontend/memberdetail/display'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json() as { url?: string }
    if (!url || !url.includes('bni')) {
      return NextResponse.json({ success: false, error: 'URL invalid' }, { status: 400 })
    }

    // Extract query string from the profile URL (e.g. encryptedMemberId=...&name=...)
    const qIdx = url.indexOf('?')
    const params = qIdx >= 0 ? url.slice(qIdx + 1) : ''

    // Call BNI's internal AJAX endpoint which returns rendered HTML with the member data
    const res = await fetch(BNI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: `parameters=${encodeURIComponent(params)}&languages=%7B%7D&pageMode=Live_Site&websitetype=1&website_type=1&website_id=&memberId=`,
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `BNI API a returnat ${res.status}` }, { status: 502 })
    }

    const html = await res.text()

    // Photo: <img src="/web/open/appsCmsImageDownload?imageObjectId=..." alt="... profile picture">
    let photoUrl: string | null = null
    const imgMatch = html.match(/<img[^>]+src="([^"]*appsCmsImageDownload[^"]+)"/)
    if (imgMatch) {
      photoUrl = imgMatch[1].startsWith('http')
        ? imgMatch[1]
        : `https://www.bniconnectglobal.com${imgMatch[1]}`
    }

    // Company: <h2>Name</h2>\n<p>\n<a href="...">COMPANY NAME</a>
    let company: string | null = null
    const companyMatch = html.match(/<h2>[^<]+<\/h2>\s*<p>\s*(?:<a[^>]*>)?([^<]+)/)
    if (companyMatch) company = companyMatch[1].trim()

    // Domain/classification: <h6>Domain | Domain</h6> (sometimes repeated with |)
    let domain: string | null = null
    const h6Match = html.match(/<h6>([^<]+)<\/h6>/)
    if (h6Match) {
      // Take the first part before | (they repeat)
      domain = h6Match[1].split('|')[0].trim()
    }

    return NextResponse.json({
      success: true,
      data: { photoUrl, company, domain },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Scraping a esuat' }, { status: 500 })
  }
}
