import { Bone } from "@/components/ui/route-skeleton"

/**
 * force-dynamic (the payment-URL env check runs per request), so <Link> does
 * not prefetch this route at all without a boundary — the tap from the landing
 * page pays a full round trip on a page that does no I/O of its own. The
 * skeleton makes the shell prefetchable so the wait is visible instead of
 * silent.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#090c14" }} aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Loading…
      </span>
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Bone w={72} h={14} r={5} />
        </div>
        <div
          className="p-8 flex flex-col gap-4"
          style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Bone w={128} h={28} r={9999} delay={60} />
          <Bone w="62%" h={30} r={8} delay={110} />
          <Bone w="100%" h={12} r={4} delay={150} />
          <Bone w="88%" h={12} r={4} delay={190} />
          <div className="flex flex-col gap-4 mt-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Bone w={24} h={24} r={9999} delay={240 + i * 70} />
                <Bone w="78%" h={12} r={4} delay={270 + i * 70} />
              </div>
            ))}
          </div>
          <Bone w="100%" h={54} r={16} delay={480} />
        </div>
      </div>
    </div>
  )
}
