"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sun, UtensilsCrossed, Dumbbell, MessageCircle, User } from "lucide-react"

/**
 * Five tabs, named for what is inside them, with the word under the icon.
 *
 * The earlier pill had four unlabelled icons — Home, Progress, "Plans", Profile.
 * A client looking for her food does not think "Plans", and the only way to
 * message her coach was to open Profile first. Labels cost 12px of height and
 * remove the guessing.
 */
const tabs = [
  { icon: Sun, label: "Today", href: "/dashboard", exact: true },
  { icon: UtensilsCrossed, label: "Food", href: "/dashboard/food" },
  { icon: Dumbbell, label: "Move", href: "/dashboard/move" },
  { icon: MessageCircle, label: "Chat", href: "/dashboard/messages" },
  { icon: User, label: "Me", href: "/account" },
]

export function BottomNavPill() {
  const pathname = usePathname()
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href)))
  )

  return (
    <nav
      className="fixed z-50 left-0 right-0"
      style={{
        bottom: 0,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        background: "rgba(9, 12, 20, 0.88)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
      aria-label="Main"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5" style={{ height: 60 }}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex
          const Icon = tab.icon
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 26,
                  background: isActive ? "rgba(45, 212, 191, 0.16)" : "transparent",
                  transition: "background 200ms ease",
                }}
              >
                <Icon size={20} style={{ color: isActive ? "#2dd4bf" : "rgba(255, 255, 255, 0.55)" }} />
              </span>
              <span
                className="text-[10.5px] font-semibold"
                style={{ color: isActive ? "#2dd4bf" : "rgba(255, 255, 255, 0.55)", letterSpacing: "0.02em" }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
