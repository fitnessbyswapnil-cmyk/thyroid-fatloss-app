import { CardBlock, ClientShell } from "@/components/ui/route-skeleton"

/** Chart first, then the measurement cards, as ProgressView orders them. */
export default function Loading() {
  return (
    <ClientShell title="My Progress">
      <CardBlock lines={1} block={200} />
      <CardBlock lines={2} block={140} delay={120} />
      <CardBlock lines={3} delay={240} />
    </ClientShell>
  )
}
