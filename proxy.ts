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

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
