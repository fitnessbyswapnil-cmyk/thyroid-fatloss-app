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
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {})
    window.addEventListener("load", onLoad)
    return () => window.removeEventListener("load", onLoad)
  }, [])
  return null
}
