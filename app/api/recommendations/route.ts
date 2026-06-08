import { NextRequest, NextResponse } from 'next/server'

// Sample recommendations data (replace with database calls)
const recommendations = [
  {
    id: 1,
    from: 'John Doe',
    to: 'Ana Popescu',
    description: 'Digital Marketing Agency',
    details: 'Great service for web presence',
    date: '2024-05-20',
    status: 'approved'
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: recommendations,
      total: recommendations.length
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    if (!body.recommendingMember || !body.recommendedMember) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification
    // 3. Create audit log

    const newRecommendation = {
      id: recommendations.length + 1,
      from: body.recommendingMember,
      to: body.recommendedMember,
      group: body.group,
      domain: body.domain,
      recommendingGroup: body.recommendingGroup,
      recommenderPhone: body.recommenderPhone,
      recommenderEmail: body.recommenderEmail,
      recommendedPhone: body.recommendedPhone,
      contactNotes: body.contactNotes,
      consentConfirmed: body.consentConfirmed,
      description: body.businessDescription,
      details: body.referralDetails,
      date: new Date().toISOString().split('T')[0],
      status: 'new'
    }

    recommendations.push(newRecommendation)

    return NextResponse.json({
      success: true,
      data: newRecommendation,
      message: 'Recommendation submitted successfully'
    }, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to submit recommendation' },
      { status: 500 }
    )
  }
}
