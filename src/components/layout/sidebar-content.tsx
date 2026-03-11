"use client"

import Link from "next/link"
import { TenantSwitcher } from "./tenant-switcher"
import { SidebarNav } from "./sidebar-nav"
import { navMain, navAdvanced, navBottom } from "./nav-config"

interface SidebarContentProps {
  onNavigate?: () => void
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-md"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-black">
            R
          </div>
          <span className="text-base font-black tracking-tight text-sidebar-foreground">
            RAMI
          </span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Beta
          </span>
        </Link>
      </div>

      {/* Tenant switcher */}
      <div className="shrink-0 px-3 py-3">
        <TenantSwitcher />
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <SidebarNav items={navMain} onNavigate={onNavigate} />

        <div className="my-3 h-px bg-sidebar-border" />

        <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          Modules avancés
        </div>
        <SidebarNav items={navAdvanced} onNavigate={onNavigate} />
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
        <SidebarNav items={navBottom} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
