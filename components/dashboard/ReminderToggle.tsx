"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2, Check } from "lucide-react"
import { savePushSubscription, removePushSubscription } from "@/app/actions/push"

/** VAPID public keys are base64url; the Push API wants a Uint8Array. */
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

type State = "loading" | "unsupported" | "needs-install" | "off" | "on" | "blocked"

/**
 * Reminder opt-in. Adherence is the whole point of the app's tracking, and
 * before this nothing could reach a client who didn't open it herself.
 *
 * Handles the awkward platform reality honestly rather than silently failing:
 * on iPhone, web push only works once the app is added to the Home Screen, so
 * that case gets its own explanation instead of a dead button.
 */
/**
 * serviceWorker.ready never settles when no worker is registered — it does not
 * reject, so a .catch() on it is dead code. Both call sites below awaited it
 * bare, which meant the card could sit in its initial loading state forever, and
 * tapping Enable could leave the spinner running after she had already granted
 * permission. Racing it against a timeout turns "never" into "no".
 */
async function readyOrNull(ms = 5000): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null
  return Promise.race([
    navigator.serviceWorker.ready.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

/**
 * @param hideWhenOn  Render nothing once she is already subscribed. The
 *   dashboard placement is a nudge and should disappear the moment it has done
 *   its job; Settings is the control, and keeps showing "Reminders are on" so
 *   she can see the state and turn it back off.
 */
export function ReminderToggle({ hideWhenOn = false }: { hideWhenOn?: boolean } = {}) {
  const [state, setState] = useState<State>("loading")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (typeof window === "undefined") return
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
      if (!supported) {
        // iOS exposes PushManager only in an installed (standalone) PWA.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const standalone = window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as { standalone?: boolean }).standalone === true
        setState(isIOS && !standalone ? "needs-install" : "unsupported")
        return
      }
      if (Notification.permission === "denied") { setState("blocked"); return }
      const reg = await readyOrNull()
      if (!reg) { setState("unsupported"); return }
      const existing = await reg.pushManager.getSubscription().catch(() => null)
      setState(existing ? "on" : "off")
    })()
  }, [])

  const enable = async () => {
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") { setState(permission === "denied" ? "blocked" : "off"); return }

      const reg = await readyOrNull()
      if (!reg) { setState("unsupported"); return }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) { setState("unsupported"); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
      const res = await savePushSubscription({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
      })
      setState(res.success ? "on" : "off")
    } catch {
      setState("off")
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setState("off")
    } catch {
      /* leave state as-is */
    } finally {
      setBusy(false)
    }
  }

  if (state === "loading") return null
  if (hideWhenOn && state === "on") return null

  // Rendering nothing here was the wrong call. In the Android WebView build
  // there is no Push API, so the setting simply vanished — she sees a gap where
  // a control should be and no way to know reminders exist at all. Saying so is
  // better than an absence she has to interpret.
  if (state === "unsupported") {
    return (
      <div
        className="flex items-start gap-3 p-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
          <BellOff size={18} style={{ color: "#7e8a9e" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "#e8eaf0" }}>Reminders aren&rsquo;t available here</p>
          <p className="text-[11.5px] mt-0.5" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>
            This version of the app can&rsquo;t send notifications. Open ThyroWell in Chrome and
            turn them on there — it&rsquo;s the same account.
          </p>
        </div>
      </div>
    )
  }

  const card = {
    background: state === "on" ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${state === "on" ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`,
  } as const

  return (
    <div className="flex items-center gap-3 p-5 rounded-2xl" style={card}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: state === "on" ? "rgba(52,211,153,0.14)" : "rgba(45,212,191,0.12)" }}
      >
        {state === "on"
          ? <Check size={19} style={{ color: "#34d399" }} strokeWidth={3} />
          : state === "blocked"
          ? <BellOff size={19} style={{ color: "#7e8a9e" }} />
          : <Bell size={19} style={{ color: "#2dd4bf" }} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: "#e8eaf0" }}>
          {state === "on" ? "Reminders are on" : "Gentle reminders"}
        </p>
        <p className="text-[11.5px] mt-0.5" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>
          {state === "on" && "We'll nudge you when your check-in is due or your coach replies."}
          {state === "off" && "A quiet nudge when your check-in is due or your coach replies."}
          {state === "blocked" && "Notifications are blocked in your browser settings — enable them there to turn this on."}
          {state === "needs-install" && "On iPhone, add ThyroWell to your Home Screen first (Share → Add to Home Screen), then reminders can be switched on."}
        </p>
      </div>

      {(state === "off" || state === "on") && (
        <button
          onClick={state === "on" ? disable : enable}
          disabled={busy}
          className="shrink-0 text-[11.5px] font-semibold rounded-full px-3.5 py-2"
          style={
            state === "on"
              ? { color: "#7e8a9e", border: "1px solid rgba(255,255,255,0.1)" }
              : { color: "#06231f", background: "#2dd4bf" }
          }
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : state === "on" ? "Turn off" : "Turn on"}
        </button>
      )}
    </div>
  )
}
