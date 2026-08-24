import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { listMessages } from "@/app/actions/messages"
import { ChatView } from "@/components/messages/ChatView"

export default async function CoachMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  // Locally verified token instead of an Auth-server round trip.
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  // The role check and the client's name are independent of each other, so they
  // go out together rather than as two round trips to Singapore.
  const [{ data: me }, { data: client }] = await Promise.all([
    supabase.from("clients").select("role").eq("id", user.id).single(),
    supabase.from("clients").select("full_name").eq("id", id).single(),
  ])
  if (!me || (me.role !== "coach" && me.role !== "admin")) redirect("/dashboard")

  // Deliberately NOT folded into the batch above. listMessages marks the other
  // side's messages read as a side effect of fetching them, and for a caller who
  // is not the coach it resolves to that caller's OWN thread — so hitting this
  // URL as a client would silently mark her coach's messages read on a screen
  // she is about to be redirected away from. The gate has to clear first.
  const initial = await listMessages(id)
  return <ChatView initial={initial} clientId={id} asCoach title={`Chat · ${client?.full_name || "Client"}`} backHref={`/coach/client/${id}`} />
}
