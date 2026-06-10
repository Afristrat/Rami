"use client"

import { useTranslations } from "next-intl"
import { Clock } from "lucide-react"

interface NextScheduledCardProps {
  /** Date/heure formatée du prochain post — null si aucun post planifié */
  dateLabel: string | null
  /** Titre du prochain post — null si aucun post planifié */
  projectName: string | null
}

export function NextScheduledCard({
  dateLabel,
  projectName,
}: NextScheduledCardProps) {
  const t = useTranslations("dashboard")
  const hasPost = dateLabel !== null && projectName !== null

  return (
    <div className="glass-card group relative overflow-hidden rounded-2xl p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-lg bg-amber-400/10 p-2 text-amber-400">
          <Clock className="size-5" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t("nextPublication")}</p>
      {hasPost ? (
        <>
          <h3 className="mt-1 text-lg font-bold text-foreground">{dateLabel}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{projectName}</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground/60 italic">
          {t("noScheduledPosts")}
        </p>
      )}
    </div>
  )
}
