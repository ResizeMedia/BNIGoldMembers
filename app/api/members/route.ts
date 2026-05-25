import { NextResponse } from 'next/server'

// Sample members data
const members = [
  { id: 1, name: 'John Doe', business: 'Digital Marketing Agency', email: 'john@example.com' },
  { id: 2, name: 'Ana Popescu', business: 'IT Consulting', email: 'ana@example.com' },
  { id: 3, name: 'Mihai Ionescu', business: 'Real Estate', email: 'mihai@example.com' },
  { id: 4, name: 'Elena Sharma', business: 'Business Development', email: 'elena@example.com' },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: members,
      total: members.length
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}
