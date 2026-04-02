"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0, backgroundColor: '#f8fafc' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <div style={{ 
              width: '5rem', height: '5rem', borderRadius: '50%', 
              backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', margin: '0 auto 1.5rem',
              fontSize: '2.5rem'
            }}>
              ⚠️
            </div>

            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e3a5f' }}>
              Something Went Wrong
            </h1>
            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
              We apologize for the inconvenience. Please try refreshing the page. 
              If the problem persists, contact our support team.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                  backgroundColor: '#1e3a5f', color: 'white', border: 'none',
                  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                  backgroundColor: 'white', color: '#1e3a5f', border: '1px solid #e2e8f0',
                  textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500
                }}
              >
                Go Home
              </a>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                Need immediate assistance?
              </p>
              <a 
                href="tel:1-866-797-3332" 
                style={{ color: '#1e3a5f', textDecoration: 'none', fontWeight: 500 }}
              >
                📞 Call 1-866-797-3332
              </a>
              {error.digest && (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
