"use client"

import { useReducedMotion } from "framer-motion"

/**
 * Entrance staggering for lists, with the ramp capped.
 *
 * A per-item delay reads as polish on five cards and as lag on twenty: at
 * 100ms an index-derived delay makes the twentieth roster row appear two
 * seconds after the first, even though every row was already in the browser
 * before the animation started. The data is there; the app was choosing to
 * reveal it slowly.
 *
 * The fix is to cap the ramp rather than delete it. The first few cards still
 * cascade — that is the bit that reads as premium — and everything past the
 * cap lands together, so total reveal time is bounded no matter how long the
 * list gets. 300ms is roughly the point where a cascade stops being felt as
 * one gesture and starts being felt as waiting.
 */
export const STAGGER_CAP_SECONDS = 0.3

/**
 * Returns a function that produces the motion props for row `index`.
 *
 * `step` is the per-item delay in seconds, `y` the entrance offset in px, and
 * `base` a fixed head-start applied before the ramp (for lists that sit under
 * a header that animates first).
 *
 * Under prefers-reduced-motion this returns `initial={false}`, which makes
 * framer-motion mount the element at its final state with no tween at all —
 * not merely a faster animation. Nothing in this app honoured that setting
 * before; a client who has switched it on in Android accessibility settings
 * was still being made to wait for movement she asked not to see.
 */
export function useStaggeredEntrance(step: number, y = 10, base = 0, cap = STAGGER_CAP_SECONDS) {
  const reduceMotion = useReducedMotion()

  return (index: number) => {
    if (reduceMotion) return { initial: false as const, animate: { opacity: 1, y: 0 } }
    return {
      initial: { opacity: 0, y },
      animate: { opacity: 1, y: 0 },
      transition: { delay: base + Math.min(index * step, cap) },
    }
  }
}

/**
 * The same cap for call sites that need to keep their own transition object
 * (a spring, a custom duration) and only want the delay computed.
 */
export function useStaggerDelay(step: number, base = 0, cap = STAGGER_CAP_SECONDS) {
  const reduceMotion = useReducedMotion()
  return (index: number) => (reduceMotion ? 0 : base + Math.min(index * step, cap))
}

/**
 * For fixed (non-index-derived) reveal cascades. Returns a scale factor for
 * hand-written delays so a long sequence can be compressed in one place, and
 * collapses to 0 under reduced motion.
 */
export function useRevealScale(factor = 1) {
  const reduceMotion = useReducedMotion()
  return reduceMotion ? 0 : factor
}
