"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { UserMenu } from "./user-menu"
import { MobileNav } from "./mobile-nav"
import type { ReactNode } from "react"

interface AppHeaderProps {
  /** Slot pour injecter des composants serveur (QuotaBadge, etc.) */
  children?: ReactNode
}

export function AppHeader({ children }: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        {/* Mobile hamburger */}
        <button
          className="flex size-8 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir la navigation"
        >
          <Menu className="size-5" />
        </button>

        {/* Mobile logo (visible uniquement sur mobile) */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">
            R
          </div>
          <span className="text-base font-black tracking-tight">RAMI</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Slot (QuotaBadge, breadcrumb, etc.) */}
        {children}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </header>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </>
  )
}
