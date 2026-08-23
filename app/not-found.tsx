import Link from 'next/link'
import { Home } from 'lucide-react'

/**
 * Branded 404. Reachable from a stale link (e.g. a lesson slug that was
 * renamed) or a mistyped URL, so it should always offer a way back.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#090c14' }}>
      <div className="w-full max-w-sm text-center">
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: '#7e8a9e', letterSpacing: '0.16em' }}>
          404
        </p>
        <h1
          className="mt-2"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 28, color: '#e8eaf0' }}
        >
          We couldn&rsquo;t find that page
        </h1>
        <p className="text-sm mt-3" style={{ color: '#a9b2c1', lineHeight: 1.6 }}>
          The link may be old or mistyped. Everything else is where you left it.
        </p>
        <Link
          href="/dashboard"
          className="w-full mt-7 h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2"
          style={{ background: '#2dd4bf', color: '#06231f' }}
        >
          <Home size={16} /> Back to home
        </Link>
      </div>
    </div>
  )
}
