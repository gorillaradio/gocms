'use server'

import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { createSession, deleteSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function registerAction(formData: FormData) {
  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()
  const name = formData.get('name')?.toString()

  if (!email || !password || !name) {
    throw new Error("Dati mancanti")
  }

  // Verifica se l'email è già registrata
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new Error("Email già registrata")
  }

  // Crea l'utente con password hashata
  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({ 
    data: { 
      email, 
      password: passwordHash, 
      name 
    } 
  })

  // Crea la sessione per il nuovo utente
  await createSession(user.id)
  
  // Reindirizza all'area protetta
  redirect('/admin')
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email')?.toString()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    throw new Error("Email e password sono richiesti")
  }

  // Cerca l'utente per email
  const user = await prisma.user.findUnique({ where: { email } })
  
  if (!user || !user.password) {
    throw new Error("Credenziali non valide")
  }

  // Verifica la password
  const isValidPassword = await verifyPassword(password, user.password)
  
  if (!isValidPassword) {
    throw new Error("Credenziali non valide")
  }

  // Crea la sessione per l'utente autenticato
  await createSession(user.id)
  
  // Reindirizza all'area protetta
  redirect('/admin')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}