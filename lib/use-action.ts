"use client"

import { useState, useCallback, useRef, useEffect } from "react"

/**
 * Run a server action from a component without leaving her stuck.
 *
 * Twenty of the twenty-five client components had no try/catch at all. A
 * rejected action — a dropped connection on a train, a cold function timing out
 * — left a spinner that never stopped, a message deleted from the box and never
 * sent, or, worst, a green tick on a meal that was never recorded. That last one
 * is the expensive kind: it makes the adherence the coach sees wrong, in the
 * direction that costs trust.
 *
 * The error boundaries added earlier catch a render crash. They do not catch a
 * promise rejecting, which is the far commoner failure on patchy mobile data.
 *
 * `optimistic` exists for the tick-a-meal case: apply the change immediately,
 * and roll it back if the write does not land, so the screen never claims
 * something the database does not agree with.
 */
export interface ActionState<T> {
  run: (...args: never[]) => Promise<T | null>
  pending: boolean
  error: string | null
  clearError: () => void
}

export function useAction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: {
    /** Applied before the call; reverted if it fails. */
    optimistic?: () => void
    rollback?: () => void
    onSuccess?: (result: TResult) => void
    /** Shown to her. Written for someone who does not care whose fault it was. */
    message?: string
  } = {}
) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  useEffect(() => () => { alive.current = false }, [])

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setPending(true)
      setError(null)
      options.optimistic?.()
      try {
        const result = await fn(...args)

        // A server action that returns { success: false } has failed just as
        // surely as one that throws, and the difference is invisible to her.
        const failed =
          result && typeof result === "object" && "success" in result &&
          (result as { success: unknown }).success === false
        if (failed) {
          const msg = (result as { error?: string }).error
          if (alive.current) {
            options.rollback?.()
            setError(msg || options.message || "That didn't save. Please try again.")
          }
          return null
        }

        if (alive.current) options.onSuccess?.(result)
        return result
      } catch (e) {
        if (alive.current) {
          options.rollback?.()
          setError(
            options.message ||
              "That didn't save — you may have lost signal for a moment. Nothing is lost; please try again."
          )
        }
        console.error("[useAction]", e)
        return null
      } finally {
        // Guarded because an unmounted component setting state is a warning in
        // development and a leak in a long session.
        if (alive.current) setPending(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, options.optimistic, options.rollback, options.onSuccess, options.message]
  )

  return { run, pending, error, clearError: () => setError(null) }
}
