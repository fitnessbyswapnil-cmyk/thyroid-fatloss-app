import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and the auth call below. A
  // simple mistake could make it very hard to debug issues with users being
  // randomly logged out.

  // getClaims(), not getUser(). getUser() sends a request to the Auth server on
  // every single request that matches this proxy — including public pages with
  // no data of their own — and this project's auth server is in a different
  // region, so that round trip was landing on every navigation before any page
  // work started. It measured at roughly two seconds on /auth/login, a page
  // that touches no database at all.
  //
  // This project signs JWTs with asymmetric ES256 keys and publishes a JWKS
  // endpoint, so getClaims() verifies the token locally with WebCrypto instead.
  // It is equally trustworthy — the signature is checked, not merely decoded —
  // and it still refreshes an expiring session first, which is the part that
  // keeps people logged in.
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims ?? null

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/coach', '/onboarding']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    // no user, redirect to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  // Two /auth paths are reached WHILE signed in and must not bounce to the
  // dashboard: the callback that just established the session, and the
  // set-password screen an invited client is sent to immediately afterwards.
  // She has a session but no password she knows — redirecting her away leaves
  // her unable to sign in tomorrow, which is the whole bug this screen exists
  // to fix.
  const authPathAllowedWhileSignedIn =
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/auth/set-password')

  if (user && request.nextUrl.pathname.startsWith('/auth/') && !authPathAllowedWhileSignedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
