import { Bone, Card, CardBlock, ClientShell } from "@/components/ui/route-skeleton"

/**
 * Settings. The nav ghost is rendered unconditionally even though the real
 * page hides the bar for a lapsed client — a spare 100px of bottom padding is
 * invisible; a bar that appears and shoves the page is not.
 */
export default function Loading() {
  return (
    <ClientShell title="Settings" nav>
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} pad={20}>
          <div className="flex items-center gap-3">
            <Bone w={40} h={40} r={12} delay={i * 70} />
            <div className="flex-1 flex flex-col gap-2">
              <Bone w="40%" h={13} r={4} delay={i * 70 + 50} />
              <Bone w="65%" h={10} r={4} delay={i * 70 + 100} />
            </div>
          </div>
        </Card>
      ))}
      <CardBlock lines={2} delay={320} />
      <CardBlock lines={2} delay={420} />
      <CardBlock lines={3} delay={520} />
    </ClientShell>
  )
}
