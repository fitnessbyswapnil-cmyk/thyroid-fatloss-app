import { PageSkeleton } from "@/components/ui/PageSkeleton"

/** Streams instantly on navigation while the server finishes its queries. */
export default function Loading() {
  return <PageSkeleton rows={3} />
}
