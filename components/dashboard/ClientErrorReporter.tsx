"use client"

import { useEffect } from "react"
import { reportClientError } from "@/app/actions/client-report"

/**
 * Send browser-side faults to error_logs so the coach can see them.
 *
 * A screen that will not advance produces nothing on the server — the page was
 * delivered fine and the failure happened afterwards, on her device. That is
 * invisible from here, and it is why "it still does not work" can survive
 * several rounds of fixes. This captures the two ways it goes wrong in
 * practice: a thrown error, and a rejected promise that nothing awaited.
 *
 * Records the WebView's user agent too, because a Capacitor shell on an older
 * Android WebView is exactly the environment a desktop browser cannot
 * reproduce.
 */
export function ClientErrorReporter() {
  useEffect(() => {
    let sent = 0
    const cap = 5 // never flood the table from one broken screen

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown"

    const send = (context: string, message: string, stack?: string) => {
      if (sent >= cap) return
      sent++
      void reportClientError({
        context: `${context} · ${location.pathname} · ${ua}`.slice(0, 200),
        message,
        stack,
      })
    }

    const onError = (e: ErrorEvent) => {
      send("window.onerror", e.message || String(e.error), e.error?.stack)
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason
      send("unhandledrejection", r?.message ? String(r.message) : String(r), r?.stack)
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
