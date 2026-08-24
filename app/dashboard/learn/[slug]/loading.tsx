import { Bone, ClientShell } from "@/components/ui/route-skeleton"

/**
 * A lesson is a page of prose, so the skeleton is a title and text lines rather
 * than cards. Line widths vary so it reads as a paragraph, not a table.
 */
const LINES = ["100%", "96%", "92%", "98%", "88%", "94%", "70%"]

export default function Loading() {
  return (
    <ClientShell header={<><Bone w={20} h={20} r={6} /><Bone w={120} h={14} r={5} delay={60} /></>}>
      <Bone w="82%" h={34} r={8} />
      <Bone w={140} h={11} r={4} delay={80} />
      <div className="flex flex-col gap-3 mt-2">
        {LINES.map((w, i) => (
          <Bone key={i} w={w} h={12} r={4} delay={140 + i * 50} />
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {LINES.slice(0, 5).map((w, i) => (
          <Bone key={i} w={w} h={12} r={4} delay={500 + i * 50} />
        ))}
      </div>
    </ClientShell>
  )
}
