import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const token = req.cookies.get('session')?.value
  const isAuthenticated = token && await verifySessionToken(token)
  
  if (!isAuthenticated) {
    // Utente non loggato, redirect a /login
    return NextResponse.redirect(new URL('/login', url))
  }
  
  return NextResponse.next() // Utente autenticato, prosegue verso /admin
}

export const config = { matcher: ['/admin/:path*'] }