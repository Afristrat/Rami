"use client"

import { useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import {
  Bell,
  Check,
  CheckCheck,
  Megaphone,
  AlertTriangle,
  Sparkles,
  Send,
  Clock,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  titleKey: string
  titleParams?: Record<string, string>
  time: string
  read: boolean
}

const ICON_MAP = {
  success: Send,
  error: AlertTriangle,
  warning: Megaphone,
  info: Sparkles,
} as const

const COLOR_MAP = {
  success: "text-emerald-500 bg-emerald-500/10",
  error: "text-red-500 bg-red-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  info: "text-primary bg-primary/10",
} as const

// Mock notifications — will be replaced by real data from Supabase
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "success",
    titleKey: "postPublished",
    titleParams: { platform: "LinkedIn" },
    time: "5m",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    titleKey: "quotaWarning",
    titleParams: { percent: "85" },
    time: "1h",
    read: false,
  },
  {
    id: "3",
    type: "info",
    titleKey: "brandDnaUpdated",
    time: "3h",
    read: true,
  },
  {
    id: "4",
    type: "success",
    titleKey: "postScheduled",
    titleParams: { date: new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)) },
    time: "1d",
    read: true,
  },
]

export function NotificationPanel() {
  const t = useTranslations("notifications")
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="relative flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("title")}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 w-[360px] overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/10 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={8}
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">{t("title")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="size-3" />
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto size-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t("noNotifications")}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {t("noNotificationsDescription")}
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = ICON_MAP[notification.type]
                return (
                  <DropdownMenu.Item
                    key={notification.id}
                    onSelect={() => markRead(notification.id)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-sm outline-none transition-colors hover:bg-accent cursor-pointer border-b border-border/50 last:border-0",
                      !notification.read && "bg-primary/[0.03]"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        COLOR_MAP[notification.type]
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !notification.read && "font-medium"
                        )}
                      >
                        {t(notification.titleKey, notification.titleParams)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="size-3 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground/60">
                          {notification.time}
                        </span>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                    {notification.read && (
                      <Check className="mt-1 size-3.5 shrink-0 text-muted-foreground/30" />
                    )}
                  </DropdownMenu.Item>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <button className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                {t("viewAll")}
              </button>
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
