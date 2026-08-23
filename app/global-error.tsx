'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary for errors thrown in the root layout itself, where
 * app/error.tsx cannot render. It must supply its own <html>/<body>, and it
 * deliberately uses inline styles only — global CSS may be exactly what failed.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global-error]', error.digest ?? '(no digest)', error.message)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#090c14', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 340, textAlign: 'center' }}>
            <h1 style={{ color: '#e8eaf0', fontSize: 24, fontWeight: 600, margin: 0 }}>ThyroWell is temporarily unavailable</h1>
            <p style={{ color: '#a9b2c1', fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>
              Your data is safe. Please try again in a moment.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 24, width: '100%', height: 48, borderRadius: 999, border: 0,
                background: '#2dd4bf', color: '#06231f', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {error.digest && (
              <p style={{ color: '#404858', fontSize: 11, marginTop: 24 }}>Reference: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
