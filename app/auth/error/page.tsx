export default function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="mb-4 text-5xl">✕</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Error</h1>
        <p className="text-gray-600">
          Ocurrió un error durante la autenticación. Por favor intenta nuevamente.
        </p>
      </div>
    </div>
  )
}
