"use client"

import { useTranslations } from "next-intl"
import { TrendingUp } from "lucide-react"
import Link from "next/link"

export function AnalyticsEmptyState() {
  const t = useTranslations("analytics")

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex size-24 items-center justify-center rounded-3xl bg-violet-500/10">
        <TrendingUp className="size-12 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{t("noDataYet")}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("noDataDescription")}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
        >
          {t("createContent")}
        </Link>
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:hover:bg-white/[0.06]"
        >
          {t("viewCalendar")}
        </Link>
      </div>
    </div>
  )
}
