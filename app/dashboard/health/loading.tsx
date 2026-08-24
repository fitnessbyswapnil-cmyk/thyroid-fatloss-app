import { CardBlock, ClientShell } from "@/components/ui/route-skeleton"

/**
 * My Health: lab report import, then "what changed", the gauges, and the
 * thyroid profile card. Sizes track HealthView's stack so the gauges do not
 * shove the profile card down when they arrive.
 */
export default function Loading() {
  return (
    <ClientShell title="My Health">
      <CardBlock lines={1} block={72} />
      <CardBlock lines={2} block={120} delay={100} />
      <CardBlock lines={3} block={0} delay={200} />
    </ClientShell>
  )
}
