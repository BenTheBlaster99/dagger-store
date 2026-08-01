'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c0c0c] p-6 text-[#f5f5f5]">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-wide">Something went wrong</h1>
        <p className="text-sm text-[#a3a3a3]">{error.message || 'Unexpected error'}</p>
        <button
          onClick={reset}
          className="bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
