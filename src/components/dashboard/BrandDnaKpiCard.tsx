"use client"

import { useTranslations } from "next-intl"
import { BrandDNAGauge } from "./brand-dna-gauge"

interface BrandDnaKpiCardProps {
  score: number | null
}

export function BrandDnaKpiCard({ score }: BrandDnaKpiCardProps) {
  const t = useTranslations("dashboard")
  const displayScore = score ?? 0

  return (
    <div className="glass-card group relative flex items-center justify-between overflow-hidden rounded-2xl p-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("scoreBrandDna")}</p>
        <h3 className="mt-1 text-2xl font-bold text-foreground">
          {score !== null ? `${displayScore}%` : "—"}
        </h3>
      </div>
      <BrandDNAGauge score={displayScore} />
    </div>
  )
}
