"use client"

import { useEffect } from "react"

/**
 * Make the Android hardware back button behave like a back button.
 *
 * In the Capacitor shell this app is a WebView pointed at the live site. The
 * hardware back key does not reach the page on its own — it is an Android key
 * event, and without a listener the default is to finish the Activity. So on a
 * phone, back CLOSED THE APP from anywhere in the dashboard, which is why the
 * only way through the app was the on-screen arrow.
 *
 * targetSdk is 36, and from Android 13 the platform prefers the predictive
 * back callback over the legacy onBackPressed path, so relying on the
 * container's default is not safe here either.
 *
 * The rule below is the one people expect from a browser: if there is history
 * to go back to, go back. If there is not — she is on the dashboard root, the
 * first screen after login — let the press exit the app, because trapping it
 * would leave her with no way out except the task switcher.
 *
 * Renders nothing, and does nothing at all on the web where `back` is never
 * fired.
 */
export function AndroidBackButton() {
  useEffect(() => {
    let remove: (() => void) | undefined
    let cancelled = false

    ;(async () => {
      try {
        const { App } = await import("@capacitor/app")
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          // canGoBack reflects the WebView's own history. Next's App Router
          // pushes real history entries on navigation, so it is accurate for
          // client-side routes as well as full loads.
          if (canGoBack || window.history.length > 1) {
            window.history.back()
          } else {
            App.exitApp()
          }
        })
        if (cancelled) handle.remove()
        else remove = () => handle.remove()
      } catch {
        // Not running inside the native shell, or the plugin is unavailable in
        // this build. The browser's own back button already works there.
      }
    })()

    return () => {
      cancelled = true
      remove?.()
    }
  }, [])

  return null
}
