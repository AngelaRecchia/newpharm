/**
 * Global not-found page (fallback)
 * 
 * This is shown when:
 * - User accesses an invalid locale
 * - Error occurs outside locale context
 */
export default function GlobalNotFound() {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ maxWidth: '500px' }}>
            <h1 style={{
              fontSize: '8rem',
              fontWeight: 900,
              lineHeight: 1,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              404
            </h1>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: '1.5rem 0 1rem',
              color: '#1a202c'
            }}>
              Page Not Found
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#4a5568',
              margin: '0 0 2rem',
              lineHeight: 1.6
            }}>
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a 
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.875rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
