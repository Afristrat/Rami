"use client"

import { useState } from "react"
import { step2Schema, type Step2Data, CONTENT_FORMATS } from "@/lib/schemas/workflow.schema"
import {
  PLATFORM_CONFIG,
  VISIBLE_PLATFORMS,
  isPlatformSelectable,
  type Platform,
} from "@/lib/scheduler/platform-config"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import {
  TwitterXIcon,
  LinkedInIcon,
  InstagramIcon,
  FacebookIcon,
  PinterestIcon,
  YouTubeIcon,
  TikTokIcon,
} from "@/components/connections/platform-icons"
import { useTranslations } from "next-intl"

// On n'expose que les plateformes VISIBLES (les `hidden` sont exclues) ; les
// `coming_soon` restent affichées mais désactivées (badge « Bientôt »).
const PLATFORMS = VISIBLE_PLATFORMS.map(
  (p) => [p, PLATFORM_CONFIG[p]] as [Platform, (typeof PLATFORM_CONFIG)[Platform]]
)

/** Map platform key to its SVG icon component */
const PLATFORM_ICON_MAP: Record<Platform, React.ComponentType<{ className?: string }>> = {
  twitter: TwitterXIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  pinterest: PinterestIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
}

interface Step2PlatformsProps {
  defaultValues?: Step2Data | null
  onBack: () => void
  onNext: (data: Step2Data) => void
}

export function Step2Platforms({ defaultValues, onBack, onNext }: Step2PlatformsProps) {
  const t = useTranslations("workflow")
  const tc = useTranslations("common")

  const FORMAT_LABELS: Record<string, { label: string; desc: string }> = {
    post: { label: t("platforms.postImage"), desc: t("platforms.postImageDesc") },
    carousel: { label: t("platforms.carousel"), desc: t("platforms.carouselDesc") },
    story: { label: t("platforms.story"), desc: t("platforms.storyDesc") },
    reel: { label: t("platforms.reel"), desc: t("platforms.reelDesc") },
    article: { label: t("platforms.article"), desc: t("platforms.articleDesc") },
  }

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(defaultValues?.platforms ?? [])
  // Le format est requis par le schéma → pré-sélectionner « post » (universel) pour ne
  // jamais bloquer la progression avec une erreur cryptique ; l'utilisateur peut changer.
  const [selectedFormat, setSelectedFormat] = useState<Step2Data["format"]>(defaultValues?.format ?? "post")
  const [errors, setErrors] = useState<{ platforms?: string; format?: string }>({})

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  function handleNext() {
    const result = step2Schema.safeParse({ platforms: selectedPlatforms, format: selectedFormat })
    if (!result.success) {
      const fieldErrors: { platforms?: string; format?: string } = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as "platforms" | "format"
        // Messages i18n lisibles (jamais le message Zod brut anglais).
        if (path === "platforms") fieldErrors.platforms = t("platforms.platformRequired")
        else if (path === "format") fieldErrors.format = t("platforms.formatRequired")
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    onNext(result.data)
  }

  return (
    <div className="space-y-8">
      {/* Platform selection grid */}
      <div className="space-y-4">
        {errors.platforms && (
          <p className="text-xs text-red-500">{errors.platforms}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PLATFORMS.map(([platform, config]) => {
            const isSelected = selectedPlatforms.includes(platform)
            const selectable = isPlatformSelectable(platform)
            return (
              <button
                key={platform}
                type="button"
                onClick={() => selectable && togglePlatform(platform)}
                disabled={!selectable}
                aria-disabled={!selectable}
                title={!selectable ? tc("comingSoon") : undefined}
                className={cn(
                  "relative flex items-start gap-3 p-4 rounded-2xl transition-all text-left",
                  !selectable
                    ? "border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "border-2 border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                    : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-violet-500/50"
                )}
              >
                {/* Checkbox indicator */}
                {isSelected && selectable && (
                  <div className="absolute top-3 right-3 size-5 rounded-full bg-violet-500 flex items-center justify-center">
                    <Check className="size-3 text-white" />
                  </div>
                )}
                {/* Badge « Bientôt » pour les plateformes coming_soon */}
                {!selectable && (
                  <span className="absolute top-2.5 right-2.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    {tc("comingSoon")}
                  </span>
                )}

                {(() => {
                  const PlatformSvg = PLATFORM_ICON_MAP[platform]
                  return (
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={
                        isSelected
                          ? { backgroundColor: config.color, color: "#fff" }
                          : { backgroundColor: `${config.color}20`, color: config.color }
                      }
                    >
                      <PlatformSvg className="size-5" />
                    </span>
                  )
                })()}
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-sm font-bold",
                    isSelected ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {config.label}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {config.charLimit.toLocaleString()} car.
                  </p>
                </div>
              </button>
            )
          })}
        </div>
        {selectedPlatforms.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("platforms.selected", { count: selectedPlatforms.length })}
          </p>
        )}
      </div>

      {/* Format de contenu */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
          {t("platforms.formatOptions")}
        </h3>
        {errors.format && (
          <p className="text-xs text-red-500">{errors.format}</p>
        )}

        {/* Format chips per platform */}
        {selectedPlatforms.length > 0 && (
          <div className="space-y-3">
            {selectedPlatforms.map((platform) => {
              const cfg = PLATFORM_CONFIG[platform]
              return (
                <div key={platform} className="space-y-2">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{cfg.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_FORMATS.map((format) => {
                      const meta = FORMAT_LABELS[format]
                      const isSelected = selectedFormat === format
                      return (
                        <button
                          key={format}
                          type="button"
                          onClick={() => setSelectedFormat(format)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-medium transition-all",
                            isSelected
                              ? "bg-violet-600 text-white border border-violet-600"
                              : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:border-violet-500/50"
                          )}
                        >
                          {meta.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Character adaptation section */}
      {selectedPlatforms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
            {t("platforms.charAdaptation")}
          </h3>
          <div className="space-y-2">
            {selectedPlatforms.map((platform) => {
              const cfg = PLATFORM_CONFIG[platform]
              return (
                <div
                  key={platform}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const PlatformSvg = PLATFORM_ICON_MAP[platform]
                      return (
                        <span
                          className="flex size-6 items-center justify-center rounded"
                          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                        >
                          <PlatformSvg className="size-3.5" />
                        </span>
                      )
                    })()}
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {cfg.charLimit.toLocaleString()}
                    </span>
                    <div className="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${Math.min(100, (cfg.charLimit / 4000) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-end pt-6 border-t border-slate-200 dark:border-white/10">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10",
              "text-sm font-semibold text-slate-700 dark:text-slate-300",
              "hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all",
              "flex items-center gap-2"
            )}
          >
            <ArrowLeft className="size-4" />
            {tc("back")}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              "px-8 py-2.5 rounded-xl",
              "bg-gradient-to-r from-violet-600 to-blue-600",
              "text-white text-sm font-bold",
              "shadow-lg shadow-violet-500/20",
              "hover:scale-[1.02] active:scale-[0.98] transition-all",
              "flex items-center gap-2"
            )}
          >
            {tc("next")}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
