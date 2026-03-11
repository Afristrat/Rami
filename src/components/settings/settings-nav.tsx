"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Link2, User, Users, Bell, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    href: "/dashboard/settings/connections",
    label: "Connexions",
    icon: Link2,
    danger: false,
  },
  {
    href: "/dashboard/settings/profile",
    label: "Profil",
    icon: User,
    danger: false,
  },
  {
    href: "/dashboard/settings/team",
    label: "Équipe",
    icon: Users,
    danger: false,
  },
  {
    href: "/dashboard/settings/notifications",
    label: "Notifications",
    icon: Bell,
    danger: false,
  },
  {
    href: "/dashboard/settings/danger",
    label: "Zone de danger",
    icon: AlertTriangle,
    danger: true,
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row gap-1 lg:flex-col">
      {NAV_ITEMS.map(({ href, label, icon: Icon, danger }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active && !danger && "bg-primary/10 text-primary",
              active && danger && "bg-destructive/10 text-destructive",
              !active && !danger && "text-muted-foreground hover:bg-muted hover:text-foreground",
              !active && danger && "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
