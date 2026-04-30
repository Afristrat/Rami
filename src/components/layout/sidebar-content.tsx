"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ShieldAlert, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { TenantSwitcher } from "./tenant-switcher"
import { SidebarNav } from "./sidebar-nav"
import { navMain, navAdvanced, navBottom } from "./nav-config"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface SidebarContentProps {
  onNavigate?: () => void
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const tTheme = useTranslations("theme")
  const tNav = useTranslations("nav")
  const tMetadata = useTranslations("metadata")

  const THEMES = [
    { value: "light",  icon: Sun,     label: tTheme("light") },
    { value: "dark",   icon: Moon,    label: tTheme("dark") },
    { value: "system", icon: Monitor, label: tTheme("system") },
  ] as const

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setMounted(true)
      setIsSuperAdmin(user?.app_metadata?.role === "super_admin")
    })
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-6">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-md"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-rami-violet to-rami-blue text-white text-sm font-black shadow-lg shadow-rami-violet/20">
            R
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
              RAMI
            </span>
            <p className="text-[10px] text-sidebar-foreground/40 font-medium leading-none">
              {tMetadata("agencyOs")}
            </p>
          </div>
        </Link>
      </div>

      {/* Tenant switcher */}
      <div className="shrink-0 px-4 pb-3">
        <TenantSwitcher />
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <SidebarNav items={navMain} onNavigate={onNavigate} />

        <div className="my-3 h-px bg-sidebar-border" />

        <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          {tNav("advancedModules")}
        </div>
        <SidebarNav items={navAdvanced} onNavigate={onNavigate} />
      </div>

      {/* Super Admin link */}
      {isSuperAdmin && (
        <div className="shrink-0 border-t border-red-500/20 px-3 py-2">
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <ShieldAlert className="size-3.5 shrink-0" />
            {tNav("adminConsole")}
          </Link>
        </div>
      )}

      {/* Theme toggle */}
      <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
        <div className="flex gap-1 rounded-xl bg-sidebar-accent/40 p-1">
          {THEMES.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={label}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all",
                mounted && theme === value
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 px-3 pb-3">
        <SidebarNav items={navBottom} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
