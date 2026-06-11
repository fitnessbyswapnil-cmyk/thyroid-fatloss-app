import { redirect } from "next/navigation"

// Public self-signup is disabled — clients are provisioned by the coach after
// enrollment. Anyone hitting the old sign-up route is sent to request-access.
export default function SignUpPage() {
  redirect("/request-access")
}
