/**
 * What the client sees the instant she taps, instead of nothing.
 *
 * Next.js streams this immediately while the server finishes its queries, so a
 * navigation feels answered at once rather than frozen. Without a loading file
 * the browser sits on the old page with no feedback until every query returns,
 * which reads as a broken button rather than a slow one.
 *
 * Server component on purpose — no JS ships for it, so it cannot itself be the
 * thing that is slow to appear.
 */
export function PageSkeleton({ rows = 3, header = true }: { rows?: number; header?: boolean }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#F4F0E8", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>

      {header && (
        <header
          className="sticky top-0 z-40 px-6 py-4"
          style={{ background: "rgba(253, 251, 247, 0.85)", borderBottom: "1px solid #e2dbcd" }}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Bone w={20} h={20} r={6} />
            <Bone w={148} h={22} r={7} />
          </div>
        </header>
      )}

      <main className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl flex flex-col gap-3.5"
            style={{
              background: "#FDFBF7",
              border: "1px solid #e2dbcd",
              // Stagger so the page resolves downward rather than pulsing as one
              // block, which reads as content arriving instead of a spinner.
              animationDelay: `${i * 90}ms` }}
          >
            <Bone w="42%" h={15} r={5} />
            <Bone w="72%" h={11} r={4} />
            <Bone w="100%" h={i === 0 ? 116 : 52} r={12} />
          </div>
        ))}
      </main>
    </div>
  )
}

/** One shimmering placeholder. Keyframes live in globals.css. */
function Bone({
  w,
  h,
  r = 6 }: {
  w: number | string
  h: number
  r?: number
}) {
  return (
    <div
      className="tw-shimmer"
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: h,
        borderRadius: r,
        background: "#F1EDE1" }}
    />
  )
}
