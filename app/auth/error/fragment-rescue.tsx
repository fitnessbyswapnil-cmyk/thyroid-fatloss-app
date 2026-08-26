"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

/**
 * Completes a sign-in that already succeeded but landed here anyway.
 *
 * Supabase has two ways of handing back a session. The PKCE flow puts a `code`
 * in the query string, which /auth/callback exchanges server-side and which
 * works today. The implicit flow puts the tokens in the URL FRAGMENT:
 *
 *   /auth/callback#access_token=...&refresh_token=...&type=magiclink
 *
 * A browser never sends the fragment to the server, so the route handler sees
 * no code and no token_hash, decides the link is broken, and redirects here —
 * while a perfectly valid session sits in the address bar three characters
 * away. The client is told "this link didn't work" about a link that worked.
 *
 * That is reachable in practice: any magic link generated from the Supabase
 * dashboard, or through the admin API, comes back this way.
 *
 * So before rendering the error, look. If the tokens are there, set the session
 * and carry on to the dashboard. If they are not, this component renders
 * nothing and the page behaves exactly as before.
 */
export function FragmentRescue({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<"checking" | "restoring" | "failed">("checking")

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
    const params = new URLSearchParams(hash)
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")

    if (!access_token || !refresh_token) {
      setState("failed")
      return
    }

    setState("restoring")
    const supabase = createClient()
    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) {
          console.error("[auth/error] fragment session restore failed:", error.message)
          setState("failed")
          return
        }
        // Strip the tokens out of the address bar before moving on — they are
        // credentials, and they should not survive in history.
        window.history.replaceState(null, "", "/auth/error")
        router.replace("/dashboard")
        router.refresh()
      })
      .catch((e) => {
        console.error("[auth/error] fragment session restore threw:", e)
        setState("failed")
      })
  }, [router])

  if (state === "failed") return <>{children}</>

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#090c14" }}>
      <div className="text-center">
        <Loader2 size={22} className="animate-spin mx-auto mb-4" style={{ color: "#2dd4bf" }} />
        <p className="text-sm" style={{ color: "#7e8a9e" }}>Signing you in…</p>
      </div>
    </div>
  )
}
