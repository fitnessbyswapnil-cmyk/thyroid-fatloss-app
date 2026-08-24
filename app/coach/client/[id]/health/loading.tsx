import { Bone, CardBlock, ClientShell } from "@/components/ui/route-skeleton"

/**
 * Coach's view of a client's labs renders HealthView, which keeps the CLIENT
 * ground (#090c14) even in coach mode — so this skeleton does too. Matching
 * the screen beats matching the workspace palette.
 *
 * The title is "<client name> · Health", which is data, so it stays a bone.
 */
export default function Loading() {
  return (
    <ClientShell header={<><Bone w={20} h={20} r={6} /><Bone w={220} h={26} r={7} delay={60} /></>}>
      <CardBlock lines={1} block={72} />
      <CardBlock lines={2} block={120} delay={100} />
      <CardBlock lines={3} delay={200} />
    </ClientShell>
  )
}
