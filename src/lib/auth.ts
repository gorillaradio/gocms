import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const ALG = 'HS256'

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
  
  // Imposta cookie di sessione
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 giorni in secondi
  })
}

export async function verifySessionToken(token: string): Promise<boolean | { userId: string }> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALG] })
    return payload as { userId: string }
  } catch {
    return false
  }
}

export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0) }) // invalida il cookie immediatamente
}