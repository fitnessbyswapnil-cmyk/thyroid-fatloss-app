import Link from "next/link"
import { User } from "lucide-react"

/** Account lives here, in the header — not as a tab she has to choose between. */
export function AccountButton() {
  return (
    <Link
      href="/account"
      aria-label="Account and settings"
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <User size={18} style={{ color: "#a9b2c1" }} />
    </Link>
  )
}
