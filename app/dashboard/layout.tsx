import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Access gate for the entire client dashboard. Clients must have an active
 * subscription (provisioned by the coach after external payment) and a
 * completed profile. Coaches/admins pass through.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Who is asking, without a network call: getClaims() verifies the JWT
  // signature locally (see lib/supabase/auth.ts). This is only used to address
  // the profile row — the gate below still turns on getUser().
  const { data: claimsData } = await supabase.auth.getClaims()
  const uid = claimsData?.claims?.sub as string | undefined
  if (!uid) redirect("/auth/login")

  // These two used to run one after the other, so entering the dashboard paid a
  // Mumbai→Singapore round trip to the Auth server and THEN a second one to the
  // database before the page could render. They need nothing from each other:
  // the profile is keyed by the id the verified token already carries.
  //
  // To be precise about what this buys, because the obvious reading is wrong:
  // App Router reuses a shared layout across sibling navigations and only
  // refetches the leaf page, so this does NOT run on every bottom-nav tap. The
  // saving is on hard load and section entry — cold start through the Capacitor
  // shell, login → /dashboard, /account → /dashboard, and router.refresh() —
  // which is exactly the cold path the client complains about.
  //
  // getUser() is NOT interchangeable with the claims above here, tempting as it
  // looks. `must_set_password` is cleared by updateUser(), which swaps the user
  // object on the stored session but does not mint a new access token — so the
  // JWT keeps saying `true` for up to an hour after she has chosen a password.
  // Reading it from claims would bounce her straight back to /auth/set-password
  // from the very screen that just released the gate. This one check has to hit
  // the Auth server; it no longer has to block the profile read while it does.
  const [
    { data: { user } },
    { data: client, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("clients")
      .select("role, subscription_status, onboarding_completed")
      .eq("id", uid)
      .single(),
  ])

  if (!user) redirect("/auth/login")

  // A login the coach created carries a password the coach can read. Make her
  // replace it before she sees anything of her own, so that value is good for
  // exactly one sign-in.
  if (user.user_metadata?.must_set_password) redirect("/auth/set-password")

  // A FAILED QUERY IS NOT A MISSING PROFILE.
  //
  // This used to redirect on any falsy `client`, so a transient database error
  // sent an already-onboarded client back through onboarding — which then
  // rewrote her baseline weight, the denominator of every progress number she
  // will ever see, with no undo. The database now refuses that write too
  // (migration 022), but the redirect itself is still wrong: throw and let the
  // error boundary offer a retry rather than silently restarting her programme.
  // PGRST116 is "no rows", which genuinely means she has no profile yet.
  // Anything else is a real failure and must not be mistaken for one.
  if (error && error.code !== "PGRST116") {
    throw new Error(`Could not load your profile: ${error.message}`)
  }

  // Genuinely no profile row yet — onboarding creates the rest of the flow.
  if (!client) redirect("/onboarding")

  // The coach has a row in this table too, and the gate below only ever
  // checked clients — so signing in as the coach dropped him onto the CLIENT
  // dashboard, complete with "Weeks together" and a check-in prompt for a
  // programme he is not on. Send him where he actually works.
  if (client.role === "coach" || client.role === "admin") {
    redirect("/coach")
  }

  if (client.role === "client") {
    if (client.subscription_status !== "active") redirect("/enroll")
    if (!client.onboarding_completed) redirect("/onboarding")
  }

  return <>{children}</>
}
