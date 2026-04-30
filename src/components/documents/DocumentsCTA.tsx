"use client"

import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentsCTAProps {
  onLaunchOffer: () => void
  onViewTemplates: () => void
}

export function DocumentsCTA({ onLaunchOffer, onViewTemplates }: DocumentsCTAProps) {
  const t = useTranslations("documents")

  return (
    <div
      className={cn(
        "relative rounded-2xl py-12 px-8 text-center overflow-hidden",
        "bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20",
        "dark:from-violet-500/5 dark:to-blue-500/5 dark:border-violet-500/10"
      )}
    >
      {/* Label */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full",
            "bg-violet-500/10 border border-violet-500/20",
            "text-violet-600 dark:text-violet-400"
          )}
        >
          <Sparkles className="size-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {t("ctaPoweredBy")}
          </span>
        </div>
      </div>

      {/* Titre */}
      <h3 className="text-xl font-bold text-foreground dark:text-white">
        {t("ctaTitle")}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {t("ctaDescription")}
      </p>

      {/* Boutons */}
      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onLaunchOffer}
          className={cn(
            "inline-flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-bold text-white",
            "bg-gradient-to-r from-violet-600 to-blue-600",
            "shadow-lg shadow-violet-500/20 dark:shadow-violet-500/30",
            "hover:scale-[1.02] transition-transform"
          )}
        >
          {t("ctaLaunchOffer")}
        </button>
        <button
          type="button"
          onClick={onViewTemplates}
          className={cn(
            "inline-flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-medium transition-colors",
            "bg-card border-border text-foreground hover:bg-muted"
          )}
        >
          {t("ctaViewTemplates")}
        </button>
      </div>
    </div>
  )
}
