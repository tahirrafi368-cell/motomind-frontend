'use client'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white p-12 rounded-2xl shadow-2xl text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">ZareaAI</h1>
          <p className="text-lg text-gray-600">MotoMind Workshop Assistant</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>

          <button
            onClick={() => router.push('/signup')}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            Signup
          </button>
        </div>
      </div>
    </div>
  )
}
