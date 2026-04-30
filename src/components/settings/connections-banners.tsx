"use client"

import { useTranslations } from "next-intl"

interface ConnectionsBannersProps {
  success?: string
  error?: string
  disconnected?: string
}

export function ConnectionsBanners({ success, error, disconnected }: ConnectionsBannersProps) {
  const t = useTranslations("settings.connectionsSection")

  return (
    <>
      {success === "connected" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {t("successBanner")}
          </p>
        </div>
      )}
      {disconnected === "true" && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
          <div className="size-2 rounded-full bg-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("disconnectedBanner")}
          </p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
          <div className="size-2 rounded-full bg-destructive" />
          <p className="text-sm text-destructive">
            <span className="font-medium">{t("errorPrefix")}</span>
            {error.replace(/_/g, " ")}{t("errorSuffix")}
          </p>
        </div>
      )}
    </>
  )
}
