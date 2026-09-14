"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sun, TrendingUp, MessageCircle } from "lucide-react"

/**
 * Three tabs, and nothing else is a tab.
 *
 * Food, Move, check-in and lessons all belong to Today — they are reached by
 * tapping the thing on Today, and while she is inside them the Today tab stays
 * lit so she always knows the way back. Health lives inside Progress. Account
 * is the icon in the page header, not a destination she has to choose between.
 */
const tabs = [
  { icon: Sun, label: "Today", href: "/dashboard", owns: ["/dashboard/food", "/dashboard/move", "/dashboard/check-in", "/dashboard/learn", "/dashboard/plans"] },
  { icon: TrendingUp, label: "Progress", href: "/dashboard/progress", owns: ["/dashboard/progress-photos", "/dashboard/health"] },
  { icon: MessageCircle, label: "Coach", href: "/dashboard/messages", owns: [] as string[] },
]

function activeTab(pathname: string): number {
  return tabs.findIndex((t) =>
    t.href === "/dashboard"
      ? pathname === "/dashboard" || t.owns.some((p) => pathname.startsWith(p))
      : pathname.startsWith(t.href) || t.owns.some((p) => pathname.startsWith(p))
  )
}

export function BottomNavPill() {
  const pathname = usePathname()
  const active = activeTab(pathname)

  return (
    <nav
      className="fixed z-50 left-0 right-0"
      style={{
        bottom: 0,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        background: "rgba(9, 12, 20, 0.9)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
      aria-label="Main"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-3" style={{ height: 60 }}>
        {tabs.map((tab, index) => {
          const isActive = index === active
          const Icon = tab.icon
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1"
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: 44, height: 26, background: isActive ? "rgba(45, 212, 191, 0.16)" : "transparent" }}
              >
                <Icon size={20} style={{ color: isActive ? "#2dd4bf" : "rgba(255, 255, 255, 0.55)" }} />
              </span>
              <span className="text-[11px] font-semibold" style={{ color: isActive ? "#2dd4bf" : "rgba(255, 255, 255, 0.55)" }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
