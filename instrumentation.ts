/**
 * Keep HTTPS connections to Supabase alive between requests.
 *
 * supabase-js calls global fetch, which on Node 18+ is undici — so
 * http.globalAgent.keepAlive does nothing here. Undici's default dispatcher
 * drops idle sockets after ~4 seconds, and with one active client real requests
 * arrive further apart than that, so almost every request was paying a fresh
 * TCP + TLS handshake before its first query. Intra-region that is 10-20ms per
 * request, on top of the query itself.
 *
 * Widening the idle window means a warm instance reuses the connection instead.
 * It does nothing for a genuinely cold start, which is a separate problem.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    const { Agent, setGlobalDispatcher } = await import('undici')
    setGlobalDispatcher(
      new Agent({ keepAliveTimeout: 60_000, keepAliveMaxTimeout: 600_000, connections: 32 })
    )
  } catch {
    // undici not resolvable in this runtime — the default dispatcher still
    // works, it just reconnects more often. Not worth failing a boot over.
  }
}
