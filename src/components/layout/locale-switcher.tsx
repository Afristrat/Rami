"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Globe, Check } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("theme")

  async function switchLocale(locale: Locale) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    })
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isPending && "opacity-50 pointer-events-none"
          )}
          aria-label={localeNames[currentLocale]}
        >
          <Globe className="size-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/10 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={8}
          align="end"
        >
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            <Globe className="inline size-3 me-1" aria-hidden="true" />
            {t("language")}
          </div>
          {locales.map((locale) => (
            <DropdownMenu.Item
              key={locale}
              onSelect={() => switchLocale(locale)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                currentLocale === locale && "bg-accent text-accent-foreground"
              )}
            >
              <span className="text-base">{localeFlags[locale]}</span>
              <span className="flex-1">{localeNames[locale]}</span>
              {currentLocale === locale && (
                <Check className="size-3.5 shrink-0 text-primary" />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
