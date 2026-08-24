import { Bone, Card } from "@/components/ui/route-skeleton"

/**
 * This page's ground is #0a0d14 and its header is px-4 with a circular back
 * button — it predates the #090c14 shell the rest of the client app uses, so
 * the skeleton matches the page as built rather than the house shell.
 */
export default function Loading() {
  return (
    <div className="min-h-screen pb-32" style={{ background: "#0a0d14" }} aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Loading…
      </span>

      <div
        className="sticky top-0 z-50 px-4 py-4"
        style={{ background: "rgba(10,13,20,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-4">
          <Bone w={40} h={40} r={9999} />
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold" style={{ color: "#e8eaf0" }}>
              Progress Photos
            </h1>
            {/* Week number is data — a bone, never a guessed number. */}
            <Bone w={120} h={11} r={4} delay={80} />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 p-4" style={{ borderRadius: 16, background: "rgba(255,255,255,0.04)" }}>
          <Bone w={48} h={48} r={9999} delay={140} />
          <div className="flex flex-col gap-2">
            <Bone w={90} h={11} r={4} delay={190} />
            <Bone w={120} h={16} r={5} delay={230} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Bone w={160} h={11} r={4} delay={280} />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Bone key={i} w="100%" h={132} r={16} delay={320 + i * 70} />
            ))}
          </div>
        </div>

        <Card pad={16}>
          <Bone w="100%" h={80} r={12} delay={540} />
        </Card>
        <Bone w="100%" h={56} r={16} delay={600} />
      </div>
    </div>
  )
}
