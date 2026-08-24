import { Bone } from "@/components/ui/route-skeleton"

/**
 * Enrolment is a single centred card, and it is reached by redirect from the
 * dashboard gate — so it is often the first thing a not-yet-active client sees
 * after signing in. Matching the card's exact width and padding keeps that
 * first impression from lurching.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#090c14" }} aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Loading…
      </span>
      <div className="w-full max-w-lg">
        <div
          className="p-8 flex flex-col gap-4"
          style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Bone w={148} h={28} r={9999} />
          <Bone w="70%" h={30} r={8} delay={70} />
          <Bone w="100%" h={12} r={4} delay={120} />
          <Bone w="82%" h={12} r={4} delay={160} />
          <div className="flex flex-col gap-3 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Bone w={20} h={20} r={9999} delay={220 + i * 60} />
                <Bone w="80%" h={12} r={4} delay={250 + i * 60} />
              </div>
            ))}
          </div>
          <Bone w="100%" h={54} r={16} delay={480} />
        </div>
      </div>
    </div>
  )
}
