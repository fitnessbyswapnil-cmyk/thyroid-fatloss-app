import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Who is making this request, without asking the Auth server.
 *
 * `auth.getUser()` sends an HTTP request to Supabase Auth every time it is
 * called. The auth server for this project is in Singapore while the app runs
 * in Mumbai, so each call is a round trip a page pays before doing any of its
 * own work — and the proxy has already verified the very same token moments
 * earlier.
 *
 * This project signs JWTs with asymmetric ES256 keys and publishes a JWKS
 * endpoint, so `getClaims()` verifies the signature locally with WebCrypto.
 * That is a real verification, not a decode, which is the distinction that
 * makes `getSession()` unsafe on a server and this safe. It also refreshes an
 * expiring session first, so nobody is logged out early.
 *
 * Returns null when there is no valid session, matching `getUser()`.
 */
export async function getAuthUser(
  supabase: SupabaseClient
): Promise<{ id: string; email: string | null } | null> {
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null
  return {
    id: claims.sub as string,
    email: (claims.email as string | undefined) ?? null,
  }
}
