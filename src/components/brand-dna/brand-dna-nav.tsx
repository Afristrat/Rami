"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Dna, ImageIcon, BookOpen, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { key: "overview", href: "/dashboard/brand-dna", icon: Dna },
  { key: "assets", href: "/dashboard/brand-dna/assets", icon: ImageIcon },
  { key: "guidelines", href: "/dashboard/brand-dna/guidelines", icon: BookOpen },
  { key: "edit", href: "/dashboard/brand-dna/edit", icon: Pencil },
] as const

export function BrandDnaNav() {
  const pathname = usePathname()
  const t = useTranslations("brandDna.nav")

  return (
    <nav className="flex items-center gap-1 p-1 glass-card rounded-xl w-fit">
      {NAV_ITEMS.map(({ key, href, icon: Icon }) => {
        const isActive =
          href === "/dashboard/brand-dna"
            ? pathname === href
            : pathname.startsWith(href)

        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              isActive
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/5"
            )}
          >
            <Icon className="size-4" />
            {t(key)}
          </Link>
        )
      })}
    </nav>
  )
}
