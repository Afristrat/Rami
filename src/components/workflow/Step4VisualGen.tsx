"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { generateVisualContentAction } from "@/lib/actions/workflow.actions"
import { STYLE_PRESETS } from "@/lib/services/image-generation/style-presets"
import type { Step1Data, Step2Data, GeneratedVisual, Step4Data } from "@/lib/schemas/workflow.schema"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Image as ImageIcon, ImageOff, RefreshCw, CheckCircle2, Star, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

interface Step4VisualGenProps {
  step1: Step1Data
  step2: Step2Data
  defaultValues?: Step4Data | null
  onBack: () => void
  onNext: (data: Step4Data) => void
}

export function Step4VisualGen({ step1, step2, defaultValues, onBack, onNext }: Step4VisualGenProps) {
  const t = useTranslations("workflow")
  const tc = useTranslations("common")

  const [isPending, startTransition] = useTransition()
  const [visuals, setVisuals] = useState<GeneratedVisual[]>(defaultValues?.visuals ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(defaultValues?.selectedVisualId ?? null)
  const [error, setError] = useState<string | null>(null)
  const [quotaBlocked, setQuotaBlocked] = useState<{ count: number; limit: number } | null>(null)
  // Preset de style sélectionné (null = Brand DNA pur) — injecté dans la génération.
  const [selectedPreset, setSelectedPreset] = useState<string | null>(defaultValues?.stylePresetId ?? null)
  // Preset effectivement utilisé pour les visuels affichés — permet d'indiquer
  // honnêtement qu'une régénération est nécessaire après changement de style.
  const [generatedPreset, setGeneratedPreset] = useState<string | null>(defaultValues?.stylePresetId ?? null)

  function generate(stylePresetId: string | null) {
    setError(null)
    setQuotaBlocked(null)
    startTransition(async () => {
      const result = await generateVisualContentAction(step1, step2, { stylePresetId })
      if (result.success) {
        setVisuals(result.visuals)
        setSelectedId(null)
        setGeneratedPreset(stylePresetId)
      } else if (result.quota_exceeded) {
        setQuotaBlocked({ count: result.quota_exceeded.count, limit: result.quota_exceeded.limit })
      } else {
        setError(result.error)
      }
    })
  }

  // Auto-generation si pas de donnees
  useEffect(() => {
    if (visuals.length === 0) {
      generate(selectedPreset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleNext() {
    onNext({ visuals, selectedVisualId: selectedId, stylePresetId: generatedPreset })
  }

  const presetChanged = !isPending && visuals.length > 0 && selectedPreset !== generatedPreset
  const pendingPresetLabel = STYLE_PRESETS.find((p) => p.id === selectedPreset)?.label ?? t("visuals.styleAuto")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
          {t("visuals.styleLabel")}
        </p>
        <button
          type="button"
          onClick={() => generate(selectedPreset)}
          disabled={isPending}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            "border border-slate-200 dark:border-white/10",
            "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]",
            isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
          {t("visuals.regenerate")}
        </button>
      </div>

      {/* Style visuel — preset réellement injecté dans le prompt de génération */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedPreset(null)}
          disabled={isPending}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
            selectedPreset === null
              ? "bg-violet-600 text-white"
              : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10",
            isPending && "opacity-50 cursor-not-allowed"
          )}
        >
          <Sparkles className="size-3" />
          {t("visuals.styleAuto")}
        </button>
        {STYLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setSelectedPreset(preset.id)}
            disabled={isPending}
            title={t(`visuals.presetDesc.${preset.id}` as Parameters<typeof t>[0])}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              selectedPreset === preset.id
                ? "bg-violet-600 text-white"
                : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Style changé → régénération nécessaire (jamais de fausse application) */}
      {presetChanged && (
        <div className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-xs text-violet-600 dark:text-violet-300">
          <RefreshCw className="size-3.5 shrink-0" />
          {t("visuals.styleHint", { label: pendingPresetLabel })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Quota dépassé (US-020) */}
      {quotaBlocked && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            {t("visuals.quotaTitle")}
          </p>
          <p className="mt-1 text-sm text-amber-700/90 dark:text-amber-300/90">
            {t("visuals.quotaDescription", { count: quotaBlocked.count, limit: quotaBlocked.limit })}
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
          >
            {t("visuals.quotaUpgrade")}
          </Link>
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.05] bg-white dark:bg-slate-900/50 py-16">
          <ImageIcon className="size-8 text-violet-500 animate-pulse" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("visuals.generating")}</p>
          <p className="text-xs text-slate-400 dark:text-slate-600">{t("visuals.mayTake10to20")}</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visuels générés */}
      {!isPending && visuals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {visuals.map((visual) => {
            const isSelected = selectedId === visual.id
            return (
              <button
                key={visual.id}
                type="button"
                onClick={() => setSelectedId(isSelected ? null : visual.id)}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl transition-all",
                  isSelected
                    ? "border-2 border-violet-500 ring-4 ring-violet-500/20 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                    : "border border-slate-200 dark:border-white/10 hover:border-violet-500/50"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={visual.url}
                  alt={`Visuel ${visual.id}`}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    // Image source indisponible → état cassé honnête (jamais de fausse photo)
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const fallback = target.parentElement?.querySelector("[data-img-fallback]")
                    if (fallback instanceof HTMLElement) fallback.style.display = "flex"
                  }}
                />

                {/* État image indisponible (honnête — affiché via onError) */}
                <div
                  data-img-fallback
                  style={{ display: "none" }}
                  className="absolute inset-0 flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400"
                >
                  <ImageOff className="size-6" />
                  <span className="text-[10px]">{t("visuals.imageUnavailable")}</span>
                </div>

                {/* Overlay selectionne */}
                {isSelected && (
                  <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                    <CheckCircle2 className="size-8 text-white drop-shadow-lg" />
                  </div>
                )}

                {/* Score Brand DNA — badge « estimé » si score heuristique (Vision AI indisponible) */}
                <div
                  className={cn(
                    "absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm",
                    visual.brandDnaScore >= 0.8
                      ? "bg-green-500/90 text-white"
                      : visual.brandDnaScore >= 0.6
                      ? "bg-amber-500/90 text-white"
                      : "bg-slate-500/90 text-white"
                  )}
                  title={visual.visionScored === false ? t("visuals.scoreEstimated") : undefined}
                >
                  <Star className="size-2.5" />
                  {Math.round(visual.brandDnaScore * 100)}%
                  {visual.visionScored === false && <span className="font-normal opacity-80">≈</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Selection status */}
      {!isPending && visuals.length > 0 && (
        <div className="text-center">
          {selectedId ? (
            <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
              {t("visuals.selectedModify")}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("visuals.selectOrContinue")}
            </p>
          )}
        </div>
      )}

      {/* Asset count footer */}
      {!isPending && visuals.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>{t("visuals.totalAssets")}</span>
          <span className="font-medium">{visuals.length} {t("visuals.images")}</span>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "flex items-center gap-2 text-xs font-medium",
            "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          )}
        >
          <ArrowLeft className="size-4" />
          {tc("back")}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className={cn(
            "px-8 py-2.5 rounded-xl",
            "bg-gradient-to-r from-violet-600 to-blue-600",
            "text-white text-sm font-bold",
            "shadow-lg shadow-violet-500/20",
            "hover:scale-[1.02] active:scale-[0.98] transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            "flex items-center gap-2"
          )}
        >
          {t("visuals.reviewAndSelection")}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
