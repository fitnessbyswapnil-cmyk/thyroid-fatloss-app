import { Bone, Card, ClientShell, Rows } from "@/components/ui/route-skeleton"

/** Progress strip, then the lesson list — LessonsView's exact order. */
export default function Loading() {
  return (
    <ClientShell title="Learn">
      <div
        className="flex items-center gap-3 p-4"
        style={{ borderRadius: 16, background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.16)" }}
      >
        <Bone w={40} h={40} r={12} />
        <div className="flex-1 flex flex-col gap-2">
          <Bone w="35%" h={13} r={4} delay={60} />
          <Bone w="70%" h={10} r={4} delay={110} />
        </div>
      </div>
      <Rows count={6} height={72} />
    </ClientShell>
  )
}
