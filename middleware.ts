import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function computeHash(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + ':yuno-research')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /research routes
  if (!pathname.startsWith('/research')) {
    return NextResponse.next()
  }

  // Allow login page and auth API
  if (pathname === '/research/login' || pathname.startsWith('/api/research/auth')) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('research_auth')
  const password = process.env.RESEARCH_PASSWORD

  if (!authCookie || !password) {
    return NextResponse.redirect(new URL('/research/login', request.url))
  }

  const expectedHash = await computeHash(password)

  if (authCookie.value !== expectedHash) {
    return NextResponse.redirect(new URL('/research/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/research/:path*'],
}
