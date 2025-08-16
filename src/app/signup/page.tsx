import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Crea il tuo account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Registrati per accedere al sistema
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}