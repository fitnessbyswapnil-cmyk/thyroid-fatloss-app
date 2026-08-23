import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * Where every email link lands: the invite, the magic link, a password reset,
 * an email confirmation.
 *
 * This used to handle exactly one shape — a PKCE `code`. Supabase sends
 * `token_hash` + `type` for invites and recovery links depending on how the
 * project and the client library are configured, and on that shape this route
 * fell straight through to the error page. Since the invite is the only way a
 * paying client ever gets in, that failure mode costs a client rather than a
 * page view, and it is invisible until a real invite is opened from a real
 * inbox.
 *
 * Both shapes are handled now, and an invited or recovering user is sent to set
 * a password — she was never given one, and the only sign-in screen asks for it.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // An invite or a recovery link means she has no password she knows. Send her
  // to choose one rather than to a dashboard she cannot get back into tomorrow.
  const destination =
    type === 'invite' || type === 'recovery'
      ? `/auth/set-password?next=${encodeURIComponent(next)}`
      : next

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${destination}`)
    console.error('[auth/callback] verifyOtp failed:', error.message)
    return NextResponse.redirect(`${origin}/auth/error?reason=${encodeURIComponent(error.message)}`)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // A PKCE exchange carries no `type`, so decide from whether she has a
      // password set. A user created by invite has none.
      const { data: { user } } = await supabase.auth.getUser()
      const needsPassword = user && !user.user_metadata?.password_set
      return NextResponse.redirect(
        `${origin}${needsPassword ? `/auth/set-password?next=${encodeURIComponent(next)}` : next}`
      )
    }
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(`${origin}/auth/error?reason=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/auth/error?reason=missing-token`)
}
