"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function TranscriptionDetailBackLink() {
  const t = useTranslations("transcriptions")

  return (
    <Link
      href="/dashboard/transcriptions"
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:text-foreground dark:hover:text-white"
      )}
    >
      <ArrowLeft className="size-4" />
      {t("backToList")}
    </Link>
  )
}
