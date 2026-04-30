"use client"

import { useTranslations } from "next-intl"

export function SettingsLayoutClient() {
  const t = useTranslations("settings")

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
        {t("title")}
      </h1>
    </div>
  )
}
