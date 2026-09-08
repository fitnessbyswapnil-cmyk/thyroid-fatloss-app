import { redirect } from "next/navigation"

/** The old combined Plans page. Food and Move are separate tabs now. */
export default function PlansPage() {
  redirect("/dashboard/food")
}
