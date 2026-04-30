"use client"

import { useTranslations } from "next-intl"

export function TranscriptionsPageHeader() {
  const t = useTranslations("transcriptions")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-lg">
          {t("heroSubtitle")}
        </p>
      </div>
    </div>
  )
}
