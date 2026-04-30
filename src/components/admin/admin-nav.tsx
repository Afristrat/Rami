"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { LayoutDashboard, Building2, Users, Bot, Key } from "lucide-react"

type NavItem = {
  href: string
  labelKey: string
  icon: React.ReactNode
}

type NavGroup = {
  labelKey: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "navPilotage",
    items: [
      { href: "/admin/dashboard",  labelKey: "navDashboard",      icon: <LayoutDashboard className="size-3.5" /> },
      { href: "/admin/tenants",    labelKey: "navTenants",        icon: <Building2        className="size-3.5" /> },
      { href: "/admin/users",      labelKey: "navUsers",          icon: <Users            className="size-3.5" /> },
    ],
  },
  {
    labelKey: "navConfigIa",
    items: [
      { href: "/admin/prompts",    labelKey: "navPrompts",        icon: <Bot              className="size-3.5" /> },
      { href: "/admin/keys",       labelKey: "navProvidersKeys",  icon: <Key              className="size-3.5" /> },
    ],
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const t = useTranslations("admin")

  return (
    <div className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="flex items-center gap-1 py-1">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.labelKey} className="flex items-center gap-1">
              {/* Séparateur entre groupes */}
              {gi > 0 && (
                <div className="mx-1 h-4 w-px bg-border" />
              )}

              {/* Label de section */}
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium mr-1 select-none">
                {t(group.labelKey)}
              </span>

              {group.items.map(({ href, labelKey, icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/")
                return (
                  <a
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-violet-500/10 text-violet-400 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="shrink-0">{icon}</span>
                    <span className="hidden sm:block">{t(labelKey)}</span>
                  </a>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
