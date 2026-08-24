import { Bone } from "@/components/ui/route-skeleton"

/**
 * The weekly check-in is a full-screen step flow, not a scrolling page: dots
 * pinned at the top, one question centred in the middle. It also opens with a
 * read of this week's saved answers, so it genuinely waits on the database
 * before the first question can be shown.
 */
export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: "#090c14" }} aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Loading…
      </span>

      <div className="flex justify-center gap-1.5 px-6 py-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Bone key={i} w={i === 0 ? 22 : 8} h={8} r={9999} delay={i * 70} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <Bone w={220} h={13} r={5} delay={200} />
        <Bone w={280} h={30} r={8} delay={260} />
        <div className="w-full max-w-sm flex flex-col gap-3 mt-6">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} w="100%" h={56} r={16} delay={320 + i * 70} />
          ))}
        </div>
      </div>
    </div>
  )
}
