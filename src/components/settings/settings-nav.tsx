"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export function SettingsNav() {
  const pathname = usePathname()
  const t = useTranslations("settings")

  const NAV_ITEMS = [
    { href: "/settings/profile", labelKey: "general" as const },
    { href: "/settings/connections", labelKey: "connections" as const },
    { href: "/settings/team", labelKey: "team" as const },
    { href: "/settings/billing", labelKey: "billingSettings" as const },
    { href: "/settings/api", labelKey: "api" as const },
  ]

  return (
    <div className="flex gap-8 border-b border-border dark:border-white/5">
      {NAV_ITEMS.map(({ href, labelKey }) => {
        const active =
          pathname === href ||
          pathname.startsWith(href + "/") ||
          // /settings/notifications and /settings/danger are sub-sections of Général
          (href === "/settings/profile" &&
            (pathname === "/settings/notifications" || pathname === "/settings/danger"))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "pb-4 text-sm font-medium transition-colors relative",
              active
                ? "text-foreground dark:text-white font-bold border-b-2 border-violet-600 dark:border-violet-500"
                : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200 border-b-2 border-transparent"
            )}
          >
            {t(labelKey)}
            {active && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-violet-500 blur-[2px] dark:block hidden" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
