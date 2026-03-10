'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Presupuesto Personal</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Gestiona tus finanzas personales
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Controla tus ingresos y gastos de forma fácil y segura
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
