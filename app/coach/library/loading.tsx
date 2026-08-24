import { Bone, CoachShell } from "@/components/ui/route-skeleton"

/** Library: exercise/food tabs, a search field, then the item grid. */
export default function Loading() {
  return (
    <CoachShell title="Library" serif width="max-w-4xl">
      <div className="flex gap-2">
        <Bone w={132} h={38} r={12} />
        <Bone w={132} h={38} r={12} delay={70} />
      </div>
      <Bone w="100%" h={46} r={12} delay={140} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Bone key={i} w="100%" h={78} r={14} delay={200 + i * 50} />
        ))}
      </div>
    </CoachShell>
  )
}
