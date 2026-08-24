import { CardBlock, ClientShell } from "@/components/ui/route-skeleton"

/** Two plan cards, meal then workout — the same order and heights PlanCard renders. */
export default function Loading() {
  return (
    <ClientShell title="Your Plans" nav>
      <CardBlock lines={1} block={260} />
      <CardBlock lines={1} block={220} delay={120} />
    </ClientShell>
  )
}
