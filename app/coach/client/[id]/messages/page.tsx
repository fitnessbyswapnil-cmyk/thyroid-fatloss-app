import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { listMessages } from "@/app/actions/messages"
import { ChatView } from "@/components/messages/ChatView"

export default async function CoachMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: me } = await supabase.from("clients").select("role").eq("id", user.id).single()
  if (!me || (me.role !== "coach" && me.role !== "admin")) redirect("/dashboard")

  const { data: client } = await supabase.from("clients").select("full_name").eq("id", id).single()
  const initial = await listMessages(id)
  return <ChatView initial={initial} clientId={id} asCoach title={`Chat · ${client?.full_name || "Client"}`} backHref={`/coach/client/${id}`} />
}
