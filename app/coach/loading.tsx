import { Bone, CoachShell, Rows, StatGrid } from "@/components/ui/route-skeleton"

/**
 * Roster. Eight parallel queries to Singapore before anything renders, and it
 * is the coach's home screen, so it is the workspace's longest wait.
 *
 * The wordmark and the "Coach workspace" pill are fixed chrome, so they are
 * rendered for real: the header never redraws, and the indigo tells him at a
 * glance he is on the right side of the app while the roster is still coming.
 */
export default function Loading() {
  return (
    <CoachShell
      width="max-w-7xl"
      header={
        <div className="flex items-center gap-4">
          <h1 className="text-[15px] font-bold uppercase" style={{ color: "#e8eaf0", letterSpacing: "0.18em" }}>
            Thyrowell
          </h1>
          <span
            className="px-2 py-1 rounded text-[10px] font-medium uppercase"
            style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8", letterSpacing: "0.08em" }}
          >
            Coach workspace
          </span>
        </div>
      }
    >
      <StatGrid count={4} />
      <div className="mt-3">
        <Bone w={180} h={13} r={5} delay={320} />
      </div>
      <Rows count={6} height={84} />
    </CoachShell>
  )
}
