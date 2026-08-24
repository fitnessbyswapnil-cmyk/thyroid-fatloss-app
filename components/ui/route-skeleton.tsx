import type { ReactNode } from "react"

/**
 * Shared skeleton primitives for every route's `loading.tsx`.
 *
 * WHY THIS EXISTS AT ALL — the mechanism, from this version's docs
 * (node_modules/next/dist/docs/01-app/02-guides/prefetching.md, "Prefetching
 * static vs. dynamic routes"): without Cache Components, a DYNAMIC route is
 * "Prefetched: No, unless loading.js". Every screen behind the login reads
 * cookies, so every one of them is dynamic. With no loading boundary, `<Link>`
 * prefetches nothing at all and the tap pays a full server round trip with the
 * OLD screen still on display and no acknowledgement that anything happened.
 * With a boundary, Next prefetches "layout to first loading boundary", so the
 * skeleton is already in the browser and paints on touch-down while the page
 * streams in behind it.
 *
 * That is the difference between "slow" and "broken", and on Indian mobile
 * data through the Capacitor shell — where every navigation is a real network
 * round trip because the shell loads the live site over server.url — it is the
 * whole of the "it lags" complaint even when the server is fast.
 *
 * DESIGN RULES THESE PRIMITIVES ENFORCE
 * - Server Components with zero runtime imports. A fallback that must first
 *   download framer-motion or the lucide barrel before it can appear is the one
 *   thing a fallback must never be. Nothing here ships a byte of JS.
 * - Shapes are lifted from the real screens: same header height, same max
 *   width, same radii, same bottom-nav geometry. The point is that content
 *   arriving is a fill-in, not a re-layout — a skeleton that jumps is its own
 *   kind of jank.
 * - Real static titles are rendered as real text, not bones. "Your Plans" is
 *   not data; showing it means the header never changes when content lands,
 *   and it tells her the tap landed on the screen she asked for. Anything that
 *   comes from the database (a client's name, a lesson title) stays a bone —
 *   never invent a number or a name on a screen about someone's health.
 * - Motion is the `tw-shimmer` class from globals.css, which is already
 *   switched off under `prefers-reduced-motion: reduce`.
 */

/** One shimmering placeholder. `delay` staggers a group so it resolves downward. */
export function Bone({
  w = "100%",
  h = 12,
  r = 6,
  delay = 0,
  className = "",
}: {
  w?: number | string
  h?: number
  r?: number
  /** ms. Applied to the animated element itself — on the wrapper it does nothing. */
  delay?: number
  className?: string
}) {
  return (
    <div
      className={`tw-shimmer ${className}`}
      style={{
        width: typeof w === "number" ? `${w}px` : w,
        height: h,
        borderRadius: r,
        background: "rgba(255,255,255,0.05)",
        animationDelay: delay ? `${delay}ms` : undefined,
        flexShrink: 0,
      }}
    />
  )
}

/** The card surface used across both workspaces. */
export function Card({
  children,
  pad = 24,
  radius = 16,
  className = "",
}: {
  children?: ReactNode
  pad?: number
  radius?: number
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        padding: pad,
        borderRadius: radius,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  )
}

/** A card with a heading bone, some body lines, and an optional block. */
export function CardBlock({
  lines = 2,
  block,
  delay = 0,
  pad = 24,
}: {
  lines?: number
  /** Height of the trailing block (chart, plan body, photo). 0 for none. */
  block?: number
  delay?: number
  pad?: number
}) {
  return (
    <Card pad={pad}>
      <div className="flex flex-col gap-3">
        <Bone w="42%" h={15} r={5} delay={delay} />
        {Array.from({ length: lines }).map((_, i) => (
          <Bone key={i} w={i === lines - 1 ? "62%" : "88%"} h={11} r={4} delay={delay + 60 * (i + 1)} />
        ))}
        {block ? <Bone w="100%" h={block} r={12} delay={delay + 60 * (lines + 1)} /> : null}
      </div>
    </Card>
  )
}

/** The bottom nav is fixed, so a ghost of it keeps the page from shifting up. */
export function NavGhost() {
  return (
    <nav
      aria-hidden
      className="fixed z-50"
      style={{
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(9,12,20,0.75)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 9999,
        padding: "10px 32px",
      }}
    >
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} w={40} h={40} r={9999} delay={i * 80} />
        ))}
      </div>
    </nav>
  )
}

function Frame({
  ground,
  headerBg,
  header,
  width,
  padBottom,
  children,
}: {
  ground: string
  headerBg: string
  header: ReactNode
  width: string
  padBottom?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen" style={{ background: ground, paddingBottom: padBottom }} aria-busy="true">
      {/* Announced once, quietly. A screen reader should hear that the screen is
          coming, not read out a wall of empty placeholders. */}
      <span className="sr-only" aria-live="polite">
        Loading…
      </span>

      <header
        className="sticky top-0 z-40 px-6 py-4"
        style={{ background: headerBg, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className={`${width} mx-auto flex items-center gap-4`}>{header}</div>
      </header>

      <main className={`${width} mx-auto px-6 py-8 flex flex-col gap-5`}>{children}</main>
    </div>
  )
}

/**
 * Client app shell: her ground, her serif-italic headings, her bottom nav.
 * `title` is rendered with the exact classes the real header uses, so the two
 * are pixel-identical and the swap is invisible.
 */
export function ClientShell({
  title,
  header,
  width = "max-w-2xl",
  nav = false,
  children,
}: {
  title?: string
  /** Replaces the default back-arrow + title row (use when the title is data). */
  header?: ReactNode
  width?: string
  nav?: boolean
  children: ReactNode
}) {
  return (
    <>
      <Frame
        ground="#090c14"
        headerBg="rgba(9,12,20,0.8)"
        width={width}
        padBottom={nav ? "calc(100px + env(safe-area-inset-bottom, 24px))" : "calc(40px + env(safe-area-inset-bottom, 24px))"}
        header={
          header ?? (
            <>
              {/* The real back arrow is a link; a bone rather than a drawn arrow,
                  because an arrow that does not navigate is worse than none. */}
              <Bone w={20} h={20} r={6} />
              {title ? (
                <h1
                  className="text-2xl"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}
                >
                  {title}
                </h1>
              ) : (
                <Bone w={148} h={26} r={7} />
              )}
            </>
          )
        }
      >
        {children}
      </Frame>
      {nav && <NavGhost />}
    </>
  )
}

/**
 * Coach workspace shell: cooler ground, wider measure, indigo identity.
 *
 * `serif` is off by default because the workspace is deliberately not the
 * client app — but /coach/library really does render a serif-italic "Library",
 * and a skeleton that argues with its own screen swaps one jump for another.
 * Match what is there; changing it is a design decision, not a loading one.
 */
export function CoachShell({
  title,
  serif = false,
  header,
  width = "max-w-5xl",
  children,
}: {
  title?: string
  serif?: boolean
  header?: ReactNode
  width?: string
  children: ReactNode
}) {
  return (
    <Frame
      ground="#0e131c"
      headerBg="rgba(14,19,28,0.85)"
      width={width}
      header={
        header ?? (
          <>
            <Bone w={20} h={20} r={6} />
            {title ? (
              <h1
                className={serif ? "text-2xl" : "text-[15px] font-bold uppercase"}
                style={
                  serif
                    ? { fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }
                    : { color: "#e8eaf0", letterSpacing: "0.18em" }
                }
              >
                {title}
              </h1>
            ) : (
              <Bone w={140} h={26} r={7} />
            )}
          </>
        )
      }
    >
      {children}
    </Frame>
  )
}

/** Stat tiles — the coach roster header and several client cards use this grid. */
export function StatGrid({ count = 4, cols = "grid-cols-2 lg:grid-cols-4" }: { count?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} pad={20}>
          <div className="flex flex-col gap-3">
            <Bone w={40} h={40} r={12} delay={i * 70} />
            <Bone w="55%" h={20} r={5} delay={i * 70 + 60} />
            <Bone w="80%" h={10} r={4} delay={i * 70 + 120} />
          </div>
        </Card>
      ))}
    </div>
  )
}

/** A list of equal rows — rosters, lesson lists, library items. */
export function Rows({ count = 5, height = 64, radius = 16 }: { count?: number; height?: number; radius?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} pad={16} radius={radius}>
          <div className="flex items-center gap-3" style={{ height: height - 32 }}>
            <Bone w={40} h={40} r={12} delay={i * 70} />
            <div className="flex-1 flex flex-col gap-2">
              <Bone w="45%" h={13} r={4} delay={i * 70 + 50} />
              <Bone w="70%" h={10} r={4} delay={i * 70 + 100} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Chat is the one screen with a fixed viewport instead of a scrolling page:
 * header, flexible message area, composer pinned at the bottom. Getting that
 * geometry right in the fallback matters more than usual — if the composer is
 * missing while the messages load, the whole screen jumps upward when they
 * arrive.
 *
 * Bubbles alternate sides with uneven widths because a conversation is uneven;
 * a column of identical bars does not read as messages.
 */
const BUBBLES: Array<[boolean, string, number]> = [
  [false, "62%", 38],
  [true, "48%", 38],
  [false, "78%", 56],
  [true, "40%", 38],
  [false, "56%", 38],
]

export function ChatSkeleton({ title }: { title?: string }) {
  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: "#090c14" }} aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Loading…
      </span>

      <header
        className="shrink-0 px-5 py-3.5"
        style={{ background: "rgba(9,12,20,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Bone w={20} h={20} r={6} />
          <Bone w={42} h={42} r={9999} delay={60} />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {title ? (
              <h1 className="text-[15px] font-semibold truncate" style={{ color: "#e8eaf0" }}>
                {title}
              </h1>
            ) : (
              <Bone w="46%" h={15} r={5} delay={100} />
            )}
            <Bone w="62%" h={11} r={4} delay={140} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden px-4 py-5">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {BUBBLES.map(([mine, w, h], i) => (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <Bone w={w} h={h} r={16} delay={180 + i * 80} />
            </div>
          ))}
        </div>
      </main>

      <div
        className="shrink-0 px-4 py-3"
        style={{
          background: "rgba(9,12,20,0.9)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <Bone w="100%" h={46} r={16} delay={620} />
          <Bone w={44} h={44} r={9999} delay={660} />
        </div>
      </div>
    </div>
  )
}
