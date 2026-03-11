"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Link2, User, Users, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    href: "/dashboard/settings/connections",
    label: "Connexions",
    icon: Link2,
  },
  {
    href: "/dashboard/settings/profile",
    label: "Profil",
    icon: User,
  },
  {
    href: "/dashboard/settings/team",
    label: "Équipe",
    icon: Users,
  },
  {
    href: "/dashboard/settings/notifications",
    label: "Notifications",
    icon: Bell,
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row gap-1 lg:flex-col">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
