import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Accedi al tuo account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inserisci le tue credenziali per accedere
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}