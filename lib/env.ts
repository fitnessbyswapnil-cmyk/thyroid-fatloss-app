/**
 * Centralized env access for public config that the app cannot run correctly
 * without. In production these MUST be set — a missing value throws a clear
 * error at runtime instead of silently falling back to localhost / a
 * placeholder (which looks like it's working but breaks invites & checkout).
 *
 * The throw is skipped during `next build` (NEXT_PHASE = phase-production-build)
 * so a build doesn't require the values to be present; it fires at request time.
 * In local development a fallback is returned so the app still runs.
 */
function requireInProd(name: string, devFallback: string): string {
  const value = process.env[name]
  if (value && value.trim()) return value

  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
  if (process.env.NODE_ENV === 'production' && !isBuild) {
    throw new Error(
      `[config] Missing required environment variable ${name}. ` +
        `Set it in your Vercel Production environment (names are case-sensitive).`
    )
  }
  return devFallback
}

/**
 * Public site origin, e.g. https://app.thyrowell.com — used to build auth
 * redirect URLs.
 *
 * In the browser this is window.location.origin and nothing else. It is always
 * correct, always present, and cannot be misconfigured.
 *
 * It used to call requireInProd here too, which threw whenever
 * NEXT_PUBLIC_SITE_URL was not inlined into the client bundle — and a variable
 * marked Sensitive in Vercel is deliberately never inlined, so the guard fired
 * in exactly the setup it was written to protect. The throw landed inside a
 * submit handler with no try/catch, so the password-reset button span forever
 * and said nothing. A guard that strands the only route back into the account
 * is worse than the misconfiguration it guards against.
 *
 * On the server there is no window, so the env var is still required — that is
 * where a wrong origin would silently send invite links to the wrong domain.
 */
export const getSiteUrl = () =>
  typeof window !== 'undefined'
    ? window.location.origin
    : requireInProd('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')

/** External checkout/enrollment URL the /enroll and /request-access CTAs point to. */
export const getPaymentUrl = () => requireInProd('NEXT_PUBLIC_PAYMENT_URL', '#payment-not-configured')
