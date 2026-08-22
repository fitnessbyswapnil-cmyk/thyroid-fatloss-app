import Link from 'next/link'
import { Home } from 'lucide-react'

/**
 * Branded 404. Reachable from a stale link (e.g. a lesson slug that was
 * renamed) or a mistyped URL, so it should always offer a way back.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#F4F0E8' }}>
      <div className="w-full max-w-sm text-center">
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: '#8b867c', letterSpacing: '0.16em' }}>
          404
        </p>
        <h1
          className="mt-2"
          style={{ fontFamily: "'Newsreader', Georgia, serif",  fontSize: 28, color: '#1c1d20' }}
        >
          We couldn&rsquo;t find that page
        </h1>
        <p className="text-sm mt-3" style={{ color: '#5a564e', lineHeight: 1.6 }}>
          The link may be old or mistyped. Everything else is where you left it.
        </p>
        <Link
          href="/dashboard"
          className="w-full mt-7 h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2"
          style={{ background: '#155e56', color: '#dfe7dd' }}
        >
          <Home size={16} /> Back to home
        </Link>
      </div>
    </div>
  )
}
