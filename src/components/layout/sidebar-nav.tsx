"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { NavItem } from "./nav-config"

interface SidebarNavProps {
  items: NavItem[]
  onNavigate?: () => void
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const tNav = useTranslations("nav")
  const tCommon = useTranslations("common")

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href)

        const badgeLabel = item.badgeKey
          ? item.badgeKey === "new"
            ? tCommon("new")
            : item.badgeKey === "pro"
              ? tCommon("pro")
              : item.badgeKey === "agency"
                ? tCommon("agency")
                : item.badgeKey
          : null

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-primary/15 text-primary border border-primary/20 dark:bg-primary/20 dark:border-primary/20"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border border-transparent"
            )}
          >
            <Icon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
              )}
            />
            <span className="flex-1 truncate">{tNav(item.labelKey)}</span>
            {badgeLabel && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                item.badgeKey === "new"
                  ? "bg-emerald-500/15 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-400"
                  : "bg-primary/10 text-primary"
              )}>
                {badgeLabel}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
