"use client"

import { useEffect } from "react"
import { RotateCcw } from "lucide-react"
import { reportClientError } from "@/app/actions/client-report"

/**
 * Route error boundary for the check-in.
 *
 * Without this, a render fault anywhere in the nine steps unmounts the tree and
 * leaves a blank screen — indistinguishable, from the client's side, from a
 * button that does nothing. It reports what actually threw, offers a retry, and
 * offers the one recovery that fixes a poisoned draft, which is the failure
 * this route has actually had.
 */
export default function CheckInError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    void reportClientError({
      context: `check-in boundary${error.digest ? ` · digest ${error.digest}` : ""}`,
      message: error.message || "unknown",
      stack: error.stack,
    })
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#090c14" }}>
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-semibold mb-3" style={{ color: "#e8eaf0" }}>
          This screen didn&apos;t load
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "#9aa4b5" }}>
          Nothing you have already answered is lost. Try once more — and if it
          happens again, start the check-in fresh, which clears whatever was
          half-saved on this phone.
        </p>

        <button
          onClick={reset}
          className="w-full h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2 mb-3"
          style={{ background: "#2dd4bf", color: "#06231f" }}
        >
          <RotateCcw size={16} /> Try again
        </button>

        <button
          onClick={() => {
            try {
              window.localStorage.removeItem("thyrowell.checkin.draft")
            } catch {}
            window.location.href = "/dashboard/check-in"
          }}
          className="w-full h-12 rounded-full text-sm"
          style={{ color: "#9aa4b5", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          Start the check-in fresh
        </button>
      </div>
    </main>
  )
}
