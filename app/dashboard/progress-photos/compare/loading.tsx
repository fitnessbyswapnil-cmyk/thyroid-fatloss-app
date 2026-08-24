import { Bone, ClientShell } from "@/components/ui/route-skeleton"

/** Before & After: the two photo panes, then the week selector strip. */
export default function Loading() {
  return (
    <ClientShell title="Before & After">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <Bone key={i} w="100%" h={280} r={16} delay={i * 90} />
        ))}
      </div>
      <Bone w="100%" h={44} r={12} delay={200} />
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} w="100%" h={56} r={12} delay={260 + i * 60} />
        ))}
      </div>
    </ClientShell>
  )
}
