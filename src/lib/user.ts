import 'server-only'
import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) {
    redirect('/login')
  }

  const session = await verifySessionToken(token)
  
  if (!session || session === false) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: (session as { userId: string }).userId },
    select: { id: true, name: true, email: true }
  })

  if (!user) {
    redirect('/login')
  }

  return user
}