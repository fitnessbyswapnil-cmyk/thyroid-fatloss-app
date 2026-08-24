"use client"

import { animate, useMotionValue, useTransform, useReducedMotion, type MotionValue } from "framer-motion"
import { useEffect } from "react"

/**
 * Count-up for the headline numbers on the dashboard.
 *
 * This replaces four near-identical copies of a hook that called setState on
 * every animation frame. That mattered because the dashboard mounts nine of
 * them at once — wellness score plus four subscores, TSH, energy, weight,
 * best streak. Nine independent requestAnimationFrame loops each pushing a
 * React state update ~84 times over 1.4s meant the whole card subtree
 * re-rendered (re-allocating its inline style objects) roughly 750 times in
 * the first second and a half after the screen appeared, on the exact frames
 * framer-motion was also using to tween opacity, y and progress-bar width.
 * That is the window in which the app felt like it was lagging.
 *
 * A MotionValue is written straight to the DOM text node from framer's single
 * shared frame loop, so the count costs zero React renders and one rAF loop
 * for the whole screen instead of nine.
 *
 * Easing is the same expo-out curve the old hook used, so the numbers still
 * move exactly the way they did.
 */
const EXPO_OUT = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function useCountUp(
  target: number,
  { duration = 1.4, decimals = 0, start = true }: { duration?: number; decimals?: number; start?: boolean } = {}
): MotionValue<string> {
  const reduceMotion = useReducedMotion()

  // Deliberately starts at 0 on both server and first client render, matching
  // the old useState(0). Seeding it with `target` instead would hydrate a
  // different number than the server sent.
  const raw = useMotionValue(0)

  useEffect(() => {
    // Off-screen (or reduced motion): show the real number, do not tween.
    if (!start || reduceMotion) {
      raw.set(target)
      return
    }
    const controls = animate(raw, target, { duration, ease: EXPO_OUT })
    return () => controls.stop()
  }, [target, duration, start, reduceMotion, raw])

  // parseFloat drops a trailing ".0" the way the old parseFloat(toFixed())
  // did — a client whose weight is exactly 68 must still read "68 kg".
  return useTransform(raw, (v) => String(parseFloat(v.toFixed(decimals))))
}
