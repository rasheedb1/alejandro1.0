import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()

  const correct = process.env.RESEARCH_PASSWORD
  if (!correct) {
    return NextResponse.json({ error: 'RESEARCH_PASSWORD not configured' }, { status: 500 })
  }

  if (password !== correct) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Hash password for cookie
  const encoder = new TextEncoder()
  const data = encoder.encode(password + ':yuno-research')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const response = NextResponse.json({ success: true })
  response.cookies.set('research_auth', hashHex, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('research_auth')
  return response
}
