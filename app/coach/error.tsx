'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { logClientError } from '@/app/actions/client-errors'

/**
 * Catches a render crash anywhere under /coach.
 *
 * It also reports itself. The coach's app-health banner was blind to render
 * errors entirely — the only way he learned a client was stuck was if she told
 * him, and a client who hits a blank screen usually just stops opening the app.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logClientError('dashboard.render', `${error.message}${error.digest ? ` [${error.digest}]` : ''}`)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#0e131c' }}
    >
      <div className="max-w-sm w-full text-center">
        <h1
          className="text-2xl"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', color: '#e8eaf0' }}
        >
          That screen didn&rsquo;t load
        </h1>
        <p className="text-sm mt-2.5" style={{ color: '#a9b2c1', lineHeight: 1.6 }}>
          The error has been logged. If it keeps happening, the details are in your app-health panel.
        </p>
        <button
          onClick={reset}
          className="mt-6 w-full h-12 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2"
          style={{ background: '#2dd4bf', color: '#04121a' }}
        >
          <RefreshCw size={15} /> Try again
        </button>
        <a
          href="/coach"
          className="block mt-3 text-[13px]"
          style={{ color: '#7e8a9e' }}
        >
          Back to home
        </a>
      </div>
    </div>
  )
}
