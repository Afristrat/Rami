"use client"

import { useState } from "react"
import { Menu, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { UserMenu } from "./user-menu"
import { MobileNav } from "./mobile-nav"
import { NotificationPanel } from "./notification-panel"
import { HelpPanel } from "./help-panel"
import { LocaleSwitcher } from "./locale-switcher"
import type { ReactNode } from "react"

interface AppHeaderProps {
  children?: ReactNode
}

export function AppHeader({ children }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations("common")
  const tNav = useTranslations("nav")

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 relative z-10">
        {/* Mobile hamburger */}
        <button
          className="flex size-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label={tNav("openNav")}
        >
          <Menu className="size-5" />
        </button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-rami-violet to-rami-blue text-white text-xs font-black">
            R
          </div>
          <span className="text-base font-black tracking-tight">RAMI</span>
        </div>

        {/* Search bar */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("search")}
              className="w-full h-9 rounded-xl bg-muted/50 dark:bg-white/[0.06] border border-border ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1 md:hidden" />

        {/* Slot (QuotaBadge, etc.) */}
        {children}

        {/* Actions */}
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <NotificationPanel />
          <HelpPanel />
          <UserMenu />
        </div>
      </header>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  )
}
