"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { LogOut, Settings, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "./theme-provider"
import { cn } from "@/lib/utils"

const MOCK_USER = {
  name: "Amine S.",
  email: "amine@ai-mpower.com",
  initials: "AS",
}

export function UserMenu() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {MOCK_USER.initials}
          </div>
          <span className="hidden sm:block max-w-[120px] truncate text-foreground/80">
            {MOCK_USER.name}
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
            <p className="text-sm font-semibold">{MOCK_USER.name}</p>
            <p className="text-xs text-muted-foreground truncate">{MOCK_USER.email}</p>
          </div>

          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            <Settings className="size-4 text-muted-foreground" />
            Paramètres du compte
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Thème
          </div>

          {(
            [
              { value: "light" as const, label: "Clair", icon: Sun },
              { value: "dark" as const, label: "Sombre", icon: Moon },
              { value: "system" as const, label: "Système", icon: Monitor },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <DropdownMenu.Item
              key={value}
              onSelect={() => setTheme(value)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                theme === value && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10">
            <LogOut className="size-4" />
            Se déconnecter
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
