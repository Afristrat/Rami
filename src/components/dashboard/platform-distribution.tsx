"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface PlatformBar {
  nameKey: string
  percentage: number
  colorClass: string
  widthClass: string
}

const platforms: PlatformBar[] = [
  { nameKey: "instagram", percentage: 45, colorClass: "bg-violet-500", widthClass: "w-[45%]" },
  { nameKey: "linkedin", percentage: 30, colorClass: "bg-blue-600", widthClass: "w-[30%]" },
  { nameKey: "twitter", percentage: 15, colorClass: "bg-sky-400", widthClass: "w-[15%]" },
  { nameKey: "other", percentage: 10, colorClass: "bg-slate-500", widthClass: "w-[10%]" },
]

export function PlatformDistribution({ total = 186 }: { total?: number }) {
  const t = useTranslations("dashboard")
  const tPlatforms = useTranslations("platforms")

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="space-y-4">
        {platforms.map((p) => {
          const label =
            p.nameKey === "other"
              ? t("platformOther")
              : tPlatforms(p.nameKey as Parameters<typeof tPlatforms>[0])

          return (
            <div key={p.nameKey}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold text-foreground">{p.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50 dark:bg-white/5">
                <div className={cn("h-full rounded-full transition-all", p.colorClass, p.widthClass)} />
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
