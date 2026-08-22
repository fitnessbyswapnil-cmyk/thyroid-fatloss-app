"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, TrendingUp, Apple, User } from "lucide-react"

const tabs = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: TrendingUp, label: "Progress", href: "/dashboard/progress" },
  { icon: Apple, label: "Plans", href: "/dashboard/plans" },
  { icon: User, label: "Profile", href: "/account" },
]

export function BottomNavPill() {
  const pathname = usePathname()
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => (t.href === "/dashboard" ? pathname === t.href : pathname.startsWith(t.href)))
  )

  return (
    <nav
      className="fixed z-50"
      style={{
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)", 
        background: "rgba(253, 251, 247, 0.92)",
        border: "1px solid #e2dbcd",
        borderRadius: 9999,
        padding: "10px 32px",
        boxShadow: "none" }}
    >
      <div className="flex items-center gap-2 relative">
        <motion.div
          className="absolute rounded-full"
          style={{ background: "rgba(21, 94, 86, 0.15)", width: 40, height: 40, top: "50%", marginTop: -20 }}
          animate={{ left: activeIndex * 48 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
        />

        {tabs.map((tab, index) => {
          const isActive = index === activeIndex
          const Icon = tab.icon
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="relative z-10 flex items-center justify-center rounded-full"
              style={{ width: 40, height: 40 }}
              aria-label={tab.label}
            >
              <Icon
                style={{
                  width: isActive ? 22 : 20,
                  height: isActive ? 22 : 20,
                  color: isActive ? "#155e56" : "#8b867c",
                  transition: "color 200ms ease" }}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
