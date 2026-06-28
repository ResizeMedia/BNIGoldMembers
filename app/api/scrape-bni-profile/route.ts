import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json() as { url?: string }
    if (!url || !url.includes('bni')) {
      return NextResponse.json({ success: false, error: 'URL invalid' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Pagina a returnat ${res.status}` }, { status: 502 })
    }

    const html = await res.text()

    // Photo: look for the member profile image (usually in an img with class or inside a specific div)
    let photoUrl: string | null = null
    const imgMatch = html.match(/<img[^>]+class="[^"]*memberPhoto[^"]*"[^>]+src="([^"]+)"/i)
      || html.match(/<img[^>]+src="(https:\/\/cdn\.bniconnectglobal\.com\/[^"]*member[^"]*\.[^"]+)"/i)
      || html.match(/<div[^>]+class="[^"]*photo[^"]*"[^>]*>[^<]*<img[^>]+src="([^"]+)"/i)
      || html.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*profile[^"]*"/i)
      || html.match(/<img[^>]+src="(https:\/\/[^"]+)"[^>]+alt="[^"]*(?:member|photo|profil)[^"]*"/i)
    if (imgMatch) photoUrl = imgMatch[1]

    // Company name
    let company: string | null = null
    const companyMatch = html.match(/<(?:span|div|p|h\d)[^>]+class="[^"]*(?:company|business|firma)[^"]*"[^>]*>([^<]+)/i)
      || html.match(/<(?:span|div|p)[^>]*>\s*(?:Company|Companie|Firma)\s*:?\s*<\/[^>]+>\s*<[^>]+>([^<]+)/i)
      || html.match(/<td[^>]*>\s*Company\s*<\/td>\s*<td[^>]*>([^<]+)/i)
    if (companyMatch) company = companyMatch[1].trim()

    // Domain / category
    let domain: string | null = null
    const domainMatch = html.match(/<(?:span|div|p|td)[^>]+class="[^"]*(?:category|classification|domeniu)[^"]*"[^>]*>([^<]+)/i)
      || html.match(/<td[^>]*>\s*(?:Classification|Category|Domeniu)\s*<\/td>\s*<td[^>]*>([^<]+)/i)
      || html.match(/<(?:span|div|p)[^>]*>\s*(?:Classification|Category|Domeniu)\s*:?\s*<\/[^>]+>\s*<[^>]+>([^<]+)/i)
    if (domainMatch) domain = domainMatch[1].trim()

    // If structured extraction failed, try a broader pass on the raw text
    if (!company || !domain) {
      // BNI Romania pages often have "COMPANY NAME" in bold/caps followed by domain
      const lines = html.replace(/<[^>]+>/g, '\n').split('\n').map((l: string) => l.trim()).filter(Boolean)
      // Look for patterns near the member name or after specific labels
      for (let i = 0; i < lines.length; i++) {
        if (!company && /^[A-Z\s&().,-]{4,}$/.test(lines[i]) && lines[i].length < 80 && !lines[i].includes('BNI') && !lines[i].includes('MEMBER')) {
          company = lines[i]
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { photoUrl, company, domain },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Scraping a esuat' }, { status: 500 })
  }
}
