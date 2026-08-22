'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home } from 'lucide-react'

/**
 * Route-level error boundary. Without this, an unhandled render error showed
 * the raw Next.js error screen — alarming for a client mid-programme, and it
 * left her with no way forward.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // The digest correlates this screen with the server-side entry in
    // error_logs / Vercel logs.
    console.error('[route-error]', error.digest ?? '(no digest)', error.message)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#fdfbf7' }}>
      <div className="w-full max-w-sm text-center">
        <h1
          style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 28, color: '#1c1d20' }}
        >
          Something went wrong
        </h1>
        <p className="text-sm mt-3" style={{ color: '#5a564e', lineHeight: 1.6 }}>
          This one is on us, not you — nothing you logged has been lost. Try again,
          and if it keeps happening, message your coach.
        </p>

        <button
          onClick={reset}
          className="w-full mt-7 h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2"
          style={{ background: '#155e56', color: '#dfe7dd', boxShadow: '0 8px 24px rgba(21, 94, 86,0.25)' }}
        >
          <RefreshCw size={16} /> Try again
        </button>

        <Link
          href="/dashboard"
          className="w-full mt-3 h-11 rounded-full text-sm font-medium inline-flex items-center justify-center gap-2"
          style={{ color: '#8b867c' }}
        >
          <Home size={15} /> Back to home
        </Link>

        {error.digest && (
          <p className="text-[10.5px] mt-6" style={{ color: '#cfc7b6' }}>
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
