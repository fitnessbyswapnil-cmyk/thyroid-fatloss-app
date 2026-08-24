import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // getUser() is an Auth-server round trip to Singapore; getAuthUser verifies
  // the same token locally with WebCrypto. Nothing here reads user_metadata,
  // which is the one thing claims can lag on (see app/dashboard/layout.tsx),
  // so the local check is equally trustworthy here.
  //
  // Note this layout is reused across sibling navigations rather than re-run on
  // each one, so the saving lands on entering the workspace, not on every tap
  // inside it.
  const user = await getAuthUser(supabase)

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is a coach or admin
  const { data: client } = await supabase
    .from("clients")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!client || !["coach", "admin"].includes(client.role)) {
    redirect("/dashboard")
  }

  // The two apps used the same ground, the same serif-italic wordmark and the
  // same teal, so signing in as the coach looked exactly like signing in as a
  // client — and the only real cue was which numbers were on screen.
  //
  // They are not the same product. Hers is something to read when she feels
  // unwell; this is an instrument for working through a roster. So the
  // workspace gets a cooler ground, an indigo identity instead of the teal,
  // and this rail pinned above everything: a glance at the top of the screen
  // tells you which side of the app you are on.
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 200,
          background: "linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #38bdf8 100%)",
        }}
      />
      {children}
    </>
  )
}
