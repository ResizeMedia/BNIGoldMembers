import { NextResponse } from 'next/server'

// Sample domains data
const domains = [
  {
    id: 1,
    domain: 'bni-transylvania.com',
    group: 'BNI Transylvania',
    status: 'available',
    description: 'Free domain for the new Transylvania regional group'
  },
  {
    id: 2,
    domain: 'bni-moldavia.com',
    group: 'BNI Moldavia',
    status: 'available',
    description: 'Free domain for the Moldavia expansion initiative'
  },
  {
    id: 3,
    domain: 'bni-banat.com',
    group: 'BNI Banat',
    status: 'available',
    description: 'Free domain for the Banat region group'
  },
  {
    id: 4,
    domain: 'bni-bucharest-south.com',
    group: 'BNI Bucharest South',
    status: 'available',
    description: 'Free domain for the South Bucharest chapter'
  },
  {
    id: 5,
    domain: 'bni-growth-leaders.com',
    group: 'BNI Growth Leaders',
    status: 'available',
    description: 'Free domain for executive development group'
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: domains,
      total: domains.length
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch domains' },
      { status: 500 }
    )
  }
}
