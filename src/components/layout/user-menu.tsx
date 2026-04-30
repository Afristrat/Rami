"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { LogOut, Settings, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { signOutAction } from "@/lib/actions/auth.actions"
import { createClient } from "@/lib/supabase/client"

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email ? email.slice(0, 2).toUpperCase() : "?"
}

export function UserMenu() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; initials: string } | null>(null)
  const t = useTranslations("auth")
  const tTheme = useTranslations("theme")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setMounted(true)
      if (!user) return
      const name = user.user_metadata?.full_name ?? null
      const email = user.email ?? null
      setUserInfo({
        name: name ?? email ?? t("user"),
        email: email ?? "",
        initials: getInitials(name, email),
      })
    })
  }, [t])

  const displayName = userInfo?.name ?? "…"
  const displayEmail = userInfo?.email ?? ""
  const displayInitials = userInfo?.initials ?? "…"

  const themes = [
    { value: "light" as const, label: tTheme("light"), icon: Sun },
    { value: "dark" as const, label: tTheme("dark"), icon: Moon },
    { value: "system" as const, label: tTheme("system"), icon: Monitor },
  ] as const

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {displayInitials}
          </div>
          <span className="hidden sm:block max-w-[120px] truncate text-foreground/80">
            {displayName}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/10 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={8}
          align="end"
        >
          <div className="px-3 py-2.5 border-b border-border mb-1">
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>

          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            <Settings className="size-4 text-muted-foreground" />
            {t("accountSettings")}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {tTheme("title")}
          </div>

          {themes.map(({ value, label, icon: Icon }) => (
            <DropdownMenu.Item
              key={value}
              onSelect={() => setTheme(value)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                mounted && theme === value && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={async () => { await signOutAction() }}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
          >
            <LogOut className="size-4" />
            {t("signOut")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
