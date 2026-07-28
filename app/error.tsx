'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white text-gray-900">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm text-gray-600">{error.message || 'Unexpected error'}</p>
        <button
          onClick={reset}
          className="bg-black text-white px-4 py-2 text-sm"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
