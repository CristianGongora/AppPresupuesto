export default function SignUpSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="mb-4 text-5xl">✓</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">¡Registrado!</h1>
        <p className="text-gray-600 mb-6">
          Revisa tu email para confirmar tu cuenta. Una vez confirmado, podrás iniciar sesión.
        </p>
      </div>
    </div>
  )
}
