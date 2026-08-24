import { Bone } from "@/components/ui/route-skeleton"

/** Photo flow: centred intro card, then the three capture tiles. */
export default function Loading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 gap-4" style={{ background: "#090c14" }} aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Loading…
      </span>
      <Bone w={72} h={72} r={9999} />
      <Bone w={260} h={26} r={8} delay={80} />
      <Bone w={300} h={12} r={4} delay={140} />
      <Bone w={240} h={12} r={4} delay={190} />
      <div className="flex gap-3 w-full max-w-sm mt-6">
        <Bone w="100%" h={52} r={9999} delay={250} />
        <Bone w="100%" h={52} r={9999} delay={300} />
      </div>
    </div>
  )
}
