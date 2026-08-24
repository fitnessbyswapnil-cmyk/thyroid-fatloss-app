import { ChatSkeleton } from "@/components/ui/route-skeleton"

/** Coach chat. Title is hers and fixed, so it can be shown for real. */
export default function Loading() {
  return <ChatSkeleton title="Coach chat" />
}
