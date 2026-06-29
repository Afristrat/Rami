"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export interface PlatformShare {
  /** Identifiant de plateforme (valeur de l'enum) ou "other". */
  platform: string
  /** Pourcentage entier 0-100 (part des publications ciblant cette plateforme). */
  percentage: number
}

interface PlatformDistributionProps {
  /** Répartition RÉELLE calculée depuis les posts du tenant. Vide = aucun contenu. */
  distribution: PlatformShare[]
  /** Nombre total de contenus actifs (posts) du tenant. */
  total: number
}

/** Couleur de barre par plateforme (fallback neutre si inconnue). */
const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-violet-500",
  linkedin: "bg-blue-600",
  twitter: "bg-sky-400",
  facebook: "bg-blue-700",
  pinterest: "bg-red-600",
  youtube: "bg-red-500",
  tiktok: "bg-pink-500",
}

export function PlatformDistribution({ distribution, total }: PlatformDistributionProps) {
  const t = useTranslations("dashboard")
  const tPlatforms = useTranslations("platforms")

  const knownPlatforms = new Set([
    "twitter", "linkedin", "facebook", "instagram",
    "pinterest", "youtube", "tiktok", "whatsapp",
  ])

  if (distribution.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center py-8 text-center">
        <p className="text-xs text-muted-foreground">{t("platformDistributionEmpty")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="space-y-4">
        {distribution.map((p) => {
          const label =
            p.platform === "other"
              ? t("platformOther")
              : knownPlatforms.has(p.platform)
                ? tPlatforms(p.platform as Parameters<typeof tPlatforms>[0])
                : p.platform
          const colorClass = PLATFORM_COLORS[p.platform] ?? "bg-slate-500"

          return (
            <div key={p.platform}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold text-foreground">{p.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50 dark:bg-white/5">
                <div
                  className={cn("h-full rounded-full transition-all", colorClass)}
                  style={{ width: `${p.percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-6 border-t border-border pt-6 text-center">
        <p className="text-xs text-muted-foreground">{t("totalActiveContents", { total })}</p>
      </div>
    </div>
  )
}
