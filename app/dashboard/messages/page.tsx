import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { listMessages } from "@/app/actions/messages"
import { ChatView } from "@/components/messages/ChatView"

export default async function MessagesPage() {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")
  const initial = await listMessages()
  return <ChatView initial={initial} title="Coach chat" backHref="/dashboard" />
}
