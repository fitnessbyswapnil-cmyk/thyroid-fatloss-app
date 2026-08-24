import { Bone, CardBlock, CoachShell, StatGrid } from "@/components/ui/route-skeleton"

/**
 * The heaviest read in the app: thirteen parallel queries before the panel can
 * render, and the coach opens it once per client per session.
 *
 * Whose file this is comes from the database, so the name stays a bone — a
 * placeholder name on a clinical panel is the one wrong thing a skeleton could
 * say. The tab rail below the header is fixed chrome and is reserved at its
 * real height so the panel does not shift when the tabs appear.
 */
export default function Loading() {
  return (
    <CoachShell
      header={
        <div className="flex items-center gap-3 w-full">
          <Bone w={20} h={20} r={6} />
          <Bone w={40} h={40} r={9999} delay={60} />
          <div className="flex-1 flex flex-col gap-2">
            <Bone w={168} h={14} r={5} delay={110} />
            <Bone w={112} h={10} r={4} delay={150} />
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        {[96, 84, 78, 90, 72, 86].map((w, i) => (
          <Bone key={i} w={w} h={32} r={9999} delay={200 + i * 60} />
        ))}
      </div>
      <StatGrid count={4} />
      <CardBlock lines={2} block={160} delay={420} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardBlock lines={3} delay={520} />
        <CardBlock lines={3} delay={580} />
      </div>
    </CoachShell>
  )
}
