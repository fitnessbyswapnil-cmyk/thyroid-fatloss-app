import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  /**
   * Maintenance switch, flipped with the MAINTENANCE_MODE env var alone — no
   * code deploy needed once this is live.
   *
   * It runs BEFORE updateSession on purpose. During a database cutover the
   * Supabase project is read-only or gone, and updateSession talks to it to
   * refresh the session cookie; letting that run first would make the
   * maintenance page itself slow or broken at exactly the moment it matters.
   *
   * The API branch returns 503 rather than the HTML page so the mobile shell
   * and any fetch() get a status they can actually reason about instead of a
   * page of markup where JSON was expected.
   */
  if (process.env.MAINTENANCE_MODE === '1') {
    const { pathname } = request.nextUrl
    if (pathname.startsWith('/maintenance') || pathname.startsWith('/_next')) {
      return NextResponse.next()
    }
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'maintenance', message: 'ThyroWell is being upgraded. Back shortly.' },
        { status: 503, headers: { 'Retry-After': '1800' } }
      )
    }
    // Rewrite, not redirect: the address bar keeps her original URL, so when
    // maintenance ends a refresh lands her where she was.
    return NextResponse.rewrite(new URL('/maintenance', request.url))
  }

  const response = await updateSession(request)

  /**
   * Which region did the proxy actually run in?
   *
   * Vercel deploys Routing Middleware to all regions regardless of the
   * `regions` key in vercel.json, so pinning functions to sin1 does not
   * necessarily move this file. That matters: anything this proxy does over
   * the network is paid on every matched request, from wherever it lands.
   *
   * updateSession only verifies the JWT locally (getClaims + JWKS, no Auth
   * server call), so a distant proxy region should cost CPU and not latency —
   * but "should" is worth measuring. Compare this against the compute region
   * in x-vercel-id.
   */
  // Preview/dev only: it answered its question (the proxy runs in bom1 while
  // functions run in sin1), and in production it is bytes on every response
  // plus free reconnaissance on the infrastructure topology. x-vercel-id
  // already encodes PoP and compute region for anyone who needs it.
  if (process.env.VERCEL_ENV !== 'production') {
    response.headers.set('x-proxy-region', process.env.VERCEL_REGION ?? 'unknown')
  }
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images and fonts — anything with no session to refresh. Every path
     *   matched here runs the proxy, so trimming this list is the cheapest
     *   latency win available: avif, ico and woff/woff2 were still falling
     *   through to it.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|map)$).*)',
  ],
}
