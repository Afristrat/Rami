"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import {
  HelpCircle,
  BookOpen,
  Keyboard,
  MessageCircle,
  Sparkles,
  Users,
  Bug,
  Lightbulb,
  Rocket,
  ExternalLink,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface HelpItem {
  titleKey: string
  descriptionKey: string
  icon: typeof HelpCircle
  href?: string
  color: string
}

const HELP_ITEMS: HelpItem[] = [
  {
    titleKey: "gettingStarted",
    descriptionKey: "gettingStartedDescription",
    icon: Rocket,
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    titleKey: "documentation",
    descriptionKey: "documentationDescription",
    icon: BookOpen,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    titleKey: "keyboardShortcuts",
    descriptionKey: "keyboardShortcutsDescription",
    icon: Keyboard,
    color: "text-violet-500 bg-violet-500/10",
  },
  {
    titleKey: "whatsNew",
    descriptionKey: "whatsNewDescription",
    icon: Sparkles,
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    titleKey: "community",
    descriptionKey: "communityDescription",
    icon: Users,
    color: "text-pink-500 bg-pink-500/10",
  },
  {
    titleKey: "contactSupport",
    descriptionKey: "contactSupportDescription",
    icon: MessageCircle,
    color: "text-cyan-500 bg-cyan-500/10",
  },
  {
    titleKey: "reportBug",
    descriptionKey: "reportBugDescription",
    icon: Bug,
    color: "text-red-500 bg-red-500/10",
  },
  {
    titleKey: "featureRequest",
    descriptionKey: "featureRequestDescription",
    icon: Lightbulb,
    color: "text-orange-500 bg-orange-500/10",
  },
]

export function HelpPanel() {
  const t = useTranslations("help")

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="hidden sm:flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("title")}
        >
          <HelpCircle className="size-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 w-[320px] overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/10 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={8}
          align="end"
        >
          {/* Header */}
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <HelpCircle className="size-4 text-primary" />
              {t("title")}
            </h3>
          </div>

          {/* Help items */}
          <div className="max-h-[400px] overflow-y-auto p-1.5">
            {HELP_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <DropdownMenu.Item
                  key={item.titleKey}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-accent cursor-pointer"
                  onSelect={() => {
                    if (item.href) {
                      window.open(item.href, "_blank", "noopener,noreferrer")
                    }
                  }}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                      item.color
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium flex items-center gap-1">
                      {t(item.titleKey)}
                      {item.href && (
                        <ExternalLink className="size-3 text-muted-foreground/50" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
                      {t(item.descriptionKey)}
                    </p>
                  </div>
                </DropdownMenu.Item>
              )
            })}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
