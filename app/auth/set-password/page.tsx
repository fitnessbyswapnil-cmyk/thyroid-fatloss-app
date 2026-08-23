"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Eye, EyeOff, Check, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

/**
 * Where an invited client chooses a password.
 *
 * An invite signs her in without one, and the only sign-in screen asks for a
 * password — so she got in on day one and had nothing to sign in with on day
 * two. The recovery link worked, but it is labelled "Forgot your password?" for
 * a password she never had, which does not read as the way in.
 *
 * Deliberately not skippable. Skipping costs her the account on the second day,
 * which is the worst possible moment to lose someone who has just paid.
 */
function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/dashboard"

  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // Reached directly without a session, she has nothing to set a password on.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/auth/login")
      else setChecking(false)
    })
  }, [router])

  const tooShort = password.length > 0 && password.length < 8

  const save = async () => {
    if (password.length < 8) {
      setError("Please use at least 8 characters.")
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({
      password,
      // password_set lets the callback tell an invited user from a returning
      // one; clearing must_set_password is what releases the dashboard gate for
      // a login the coach created by hand.
      data: { password_set: true, must_set_password: false },
    })
    if (err) {
      setSaving(false)
      setError(
        err.message.toLowerCase().includes("different")
          ? "That's already your password — choose a new one."
          : "That didn't save. You're still signed in, so nothing is lost — please try again."
      )
      return
    }
    // The dashboard gate reads must_set_password from the server session, so
    // the cached RSC payload has to be dropped before navigating or she lands
    // on a render that still thinks she owes a password.
    router.refresh()
    router.replace(next)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#090c14" }}>
        <Loader2 size={22} className="animate-spin" style={{ color: "#2dd4bf" }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#090c14" }}>
      <div className="w-full max-w-sm">
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.16em" }}>
          One last step
        </p>
        <h1
          className="mt-2"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontSize: 30, lineHeight: 1.15, color: "#e8eaf0" }}
        >
          Choose a password
        </h1>
        <p className="text-sm mt-2.5" style={{ color: "#a9b2c1", lineHeight: 1.6 }}>
          Choose a password only you know. This replaces the temporary one you
          were given, and it&rsquo;s what you&rsquo;ll use from now on.
        </p>

        <label htmlFor="new-password" className="block text-[11px] uppercase mt-7 mb-1.5" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
          New password
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoComplete="new-password"
            autoFocus
            placeholder="At least 8 characters"
            // 16px minimum, or iOS zooms the whole page on focus.
            className="w-full h-[50px] rounded-xl px-4 pr-12"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${tooShort ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: "#e8eaf0",
              fontSize: 16,
            }}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            style={{ color: "#7e8a9e" }}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {tooShort && (
          <p className="text-[11.5px] mt-1.5" style={{ color: "#f59e0b" }}>
            A little longer — 8 characters or more.
          </p>
        )}

        {error && (
          <div
            className="mt-4 px-3.5 py-3 rounded-xl flex items-start gap-2.5"
            style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.28)" }}
            role="alert"
          >
            <AlertCircle size={15} style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }} />
            <p className="text-[12.5px]" style={{ color: "#e8eaf0", lineHeight: 1.55 }}>{error}</p>
          </div>
        )}

        <button
          onClick={save}
          disabled={saving || password.length < 8}
          className="w-full h-[50px] rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 mt-6"
          style={{
            background: password.length >= 8 ? "#2dd4bf" : "rgba(45,212,191,0.25)",
            color: "#04121a",
          }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Save and continue
        </button>

        <p className="text-[11px] mt-4 text-center" style={{ color: "#5a6578", lineHeight: 1.5 }}>
          You can change this later in Settings.
        </p>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#090c14" }}>
          <Loader2 size={22} className="animate-spin" style={{ color: "#2dd4bf" }} />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  )
}
