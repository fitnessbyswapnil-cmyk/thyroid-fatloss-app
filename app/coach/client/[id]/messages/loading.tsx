import { ChatSkeleton } from "@/components/ui/route-skeleton"

/** Coach side of the same chat; the title carries the client's name, so no title. */
export default function Loading() {
  return <ChatSkeleton />
}
