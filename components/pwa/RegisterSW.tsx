"use client"

import { useEffect } from "react"

/**
 * Registers the minimal service worker (public/sw.js) so the app is installable
 * on Android and shows an offline page. Registers only in production so local
 * dev isn't affected by a cached SW.
 */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    // On a warm cache the `load` event has usually already fired by the time
    // hydration effects run, so waiting for it meant /sw.js was never
    // registered at all — and everything downstream that waits on
    // serviceWorker.ready then hangs, because that promise never settles when
    // nothing is registered. It does not reject; it simply never resolves.
    const onLoad = () => { void navigator.serviceWorker.register("/sw.js").catch(() => {}) }
    if (document.readyState === "complete") {
      onLoad()
      return
    }
    window.addEventListener("load", onLoad)
    return () => window.removeEventListener("load", onLoad)
  }, [])
  return null
}
