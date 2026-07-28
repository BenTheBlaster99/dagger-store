'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <h1>Something went wrong</h1>
            <p>{error.message || 'Unexpected error'}</p>
            <button onClick={reset} style={{ marginTop: 16, padding: '8px 16px' }}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
