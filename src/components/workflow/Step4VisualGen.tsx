"use client"

import { useState, useTransition, useEffect } from "react"
import { generateVisualContentAction } from "@/lib/actions/workflow.actions"
import type { Step1Data, Step2Data, GeneratedVisual, Step4Data } from "@/lib/schemas/workflow.schema"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Image as ImageIcon, RefreshCw, CheckCircle2, Star } from "lucide-react"
import { useTranslations } from "next-intl"

/** Visual style presets matching design screenshot */
const STYLE_PRESETS = [
  { id: "digital-toon", label: "Digital Toon", desc: "Bold, clean lines, flat shading" },
  { id: "graphic-min", label: "Graphic Minimalism", desc: "Geometric shapes, clean space" },
  { id: "angular-retro", label: "Angular Retro", desc: "Retro mix, flat, angular" },
  { id: "flat-neon", label: "Flat Neon", desc: "Dark bg + neon accents" },
  { id: "blueprint", label: "Blueprint", desc: "Technical diagrams, mono" },
  { id: "scientific", label: "Scientific", desc: "Data viz, charts, clean" },
  { id: "dashboard", label: "Dashboard", desc: "UI mockup, data tiles" },
  { id: "corporate", label: "Corporate", desc: "Professional, clean, studio" },
  { id: "desaturated", label: "Desaturated", desc: "Muted tones, editorial" },
  { id: "isometric", label: "Isometric Art", desc: "3D iso, colorful blocks" },
  { id: "abstract", label: "Abstract", desc: "Organic shapes, gradients" },
  { id: "hero-photo", label: "Hero Photo", desc: "Stock photo, high quality" },
]

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

  const OBJECTIVE_TABS = [
    t("brief.confiance"),
    t("brief.urgence"),
    t("brief.aspiration"),
    t("brief.expertise"),
    t("brief.communaute"),
  ]

  const [isPending, startTransition] = useTransition()
  const [visuals, setVisuals] = useState<GeneratedVisual[]>(defaultValues?.visuals ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(defaultValues?.selectedVisualId ?? null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [activeObjective, setActiveObjective] = useState(OBJECTIVE_TABS[0])

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await generateVisualContentAction(step1, step2)
      if (result.success) {
        setVisuals(result.visuals)
        setSelectedId(null)
      } else {
        setError(result.error)
      }
    })
  }

  // Auto-generation si pas de donnees
  useEffect(() => {
    if (visuals.length === 0) {
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleNext() {
    onNext({ visuals, selectedVisualId: selectedId })
  }

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold"
          >
            {t("visuals.presets")}
          </button>
          <button
            type="button"
            className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            {t("visuals.customPrompt")}
          </button>
        </div>
        <button
          type="button"
          onClick={generate}
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

      {/* Objective filter tabs */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-3">
          {t("visuals.objective")}
        </p>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveObjective(tab)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                activeObjective === tab
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.05] bg-white dark:bg-slate-900/50 py-16">
          <ImageIcon className="size-8 text-violet-500 animate-pulse" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("visuals.generatingViaFal")}</p>
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

      {/* Style preset grid + generated visuals */}
      {!isPending && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* If we have generated visuals, show them */}
          {visuals.length > 0 ? (
            visuals.map((visual) => {
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
                      const target = e.target as HTMLImageElement
                      target.src = `https://picsum.photos/seed/${visual.id}/400/400`
                    }}
                  />

                  {/* Overlay selectionne */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                      <CheckCircle2 className="size-8 text-white drop-shadow-lg" />
                    </div>
                  )}

                  {/* Score Brand DNA */}
                  <div className={cn(
                    "absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm",
                    visual.brandDnaScore >= 0.8
                      ? "bg-green-500/90 text-white"
                      : visual.brandDnaScore >= 0.6
                      ? "bg-amber-500/90 text-white"
                      : "bg-slate-500/90 text-white"
                  )}>
                    <Star className="size-2.5" />
                    {Math.round(visual.brandDnaScore * 100)}%
                  </div>

                  {/* Provider badge */}
                  {visual.provider === "placeholder" && (
                    <div className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white backdrop-blur-sm">
                      {t("visuals.example")}
                    </div>
                  )}
                </button>
              )
            })
          ) : (
            /* Style presets (fallback when no visuals) */
            STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-xl aspect-square transition-all",
                  selectedPreset === preset.id
                    ? "border-2 border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                    : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-violet-500/50"
                )}
              >
                <div className="size-12 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center">
                  <ImageIcon className="size-6 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 text-center">{preset.label}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight">{preset.desc}</p>
              </button>
            ))
          )}
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
