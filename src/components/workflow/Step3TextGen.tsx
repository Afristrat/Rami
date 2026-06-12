"use client"

import { useState, useTransition, useEffect } from "react"
import { generateTextContentAction } from "@/lib/actions/workflow.actions"
import type { Step1Data, Step2Data, GeneratedCaption, Step3Data } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG, type Platform } from "@/lib/scheduler/platform-config"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw, Quote } from "lucide-react"
import {
  TwitterXIcon, LinkedInIcon, InstagramIcon, FacebookIcon,
  PinterestIcon, YouTubeIcon, MastodonIcon, TikTokIcon,
} from "@/components/connections/platform-icons"
import { useTranslations } from "next-intl"

const PLATFORM_ICON_MAP: Record<Platform, React.ComponentType<{ className?: string }>> = {
  twitter: TwitterXIcon, linkedin: LinkedInIcon, instagram: InstagramIcon,
  facebook: FacebookIcon, pinterest: PinterestIcon, youtube: YouTubeIcon,
  mastodon: MastodonIcon, tiktok: TikTokIcon,
}

interface Step3TextGenProps {
  step1: Step1Data
  step2: Step2Data
  defaultValues?: Step3Data | null
  onBack: () => void
  onNext: (data: Step3Data) => void
}

export function Step3TextGen({ step1, step2, defaultValues, onBack, onNext }: Step3TextGenProps) {
  const t = useTranslations("workflow")
  const tc = useTranslations("common")
  const [isPending, startTransition] = useTransition()
  const [captions, setCaptions] = useState<GeneratedCaption[]>(defaultValues?.captions ?? [])
  const [selectedIdx, setSelectedIdx] = useState(defaultValues?.selectedCaptionIndex ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<string>(step2.platforms[0])

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await generateTextContentAction(step1, step2)
      if (result.success) {
        setCaptions(result.captions)
        setSelectedIdx(0)
      } else {
        setError(result.error)
      }
    })
  }

  // Auto-generation au premier affichage si pas de donnees
  useEffect(() => {
    if (captions.length === 0) {
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCaptions = captions.filter((c) => c.platform === activePlatform)
  const activeCaption = activeCaptions[0]
  const config = PLATFORM_CONFIG[activePlatform as keyof typeof PLATFORM_CONFIG]

  function handleNext() {
    if (captions.length === 0) return
    onNext({ captions, selectedCaptionIndex: selectedIdx })
  }

  // Promeut une accroche alternative en hook actif. La caption est mise à jour
  // (remplacement de l'ancien hook si présent) → effet réel sur le post final.
  function swapHook(newHook: string) {
    setCaptions((prev) =>
      prev.map((c) => {
        if (c.platform !== activePlatform) return c
        const oldHook = c.hook
        const newCaption =
          oldHook && c.caption.includes(oldHook) ? c.caption.replace(oldHook, newHook) : c.caption
        const variants = [oldHook, ...(c.hookVariants ?? [])].filter(
          (h) => h && h.trim().length > 0 && h !== newHook
        )
        return { ...c, hook: newHook, caption: newCaption, charCount: newCaption.length, hookVariants: variants }
      })
    )
  }

  return (
    <div className="space-y-6">
      {/* Top tabs row — Platform + Content type tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {step2.platforms.map((platform) => {
            const cfg = PLATFORM_CONFIG[platform]
            return (
              <button
                key={platform}
                type="button"
                onClick={() => setActivePlatform(platform)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activePlatform === platform
                    ? "text-white shadow-sm"
                    : "bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                )}
                style={activePlatform === platform ? { backgroundColor: cfg.color } : undefined}
              >
                {(() => { const I = PLATFORM_ICON_MAP[platform]; return <I className="size-3.5" /> })()}
                <span>{cfg.label}</span>
              </button>
            )
          })}
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

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[0.05] bg-white dark:bg-slate-900/50 py-16">
          <Sparkles className="size-8 text-violet-500 animate-pulse" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("textGen.generatingCaptions")}</p>
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

      {/* Content when loaded */}
      {!isPending && captions.length > 0 && activeCaption && config && (
        <div className="space-y-6">
          {/* Legend du post */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                {t("textGen.postCaption")}
              </h4>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] p-4 space-y-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                {activeCaption.caption}
              </p>
              <div className="flex items-center justify-between pt-2 text-xs text-slate-400 dark:text-slate-500">
                <span className="font-mono">
                  {activeCaption.charCount} / {config.charLimit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Variantes d'accroches (Hooks) */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-3">
              {t("textGen.hookVariants")}
            </h4>
            <div className="space-y-2">
              {/* Active hook */}
              <div className={cn(
                "p-3 rounded-xl border-2 border-violet-500 bg-violet-500/5",
                "shadow-[0_0_15px_rgba(124,58,237,0.1)]"
              )}>
                <div className="flex items-start gap-2">
                  <Quote className="size-4 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      &quot;{activeCaption.hook}&quot;
                    </p>
                    <p className="text-[10px] text-violet-500 mt-1 font-medium">{t("textGen.selected")}</p>
                  </div>
                </div>
              </div>

              {/* Accroches alternatives — cliquer promeut la variante en hook actif */}
              {activeCaption.hookVariants && activeCaption.hookVariants.length > 0 &&
                activeCaption.hookVariants.map((variant, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => swapHook(variant)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer transition-all"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400">&quot;{variant}&quot;</p>
                  </button>
                ))}
            </div>
          </div>

          {/* Hashtags recommandes */}
          {activeCaption.hashtags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-3">
                {t("textGen.recommendedHashtags")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeCaption.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                      "border border-violet-500/20"
                    )}
                  >
                    #{tag.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            </div>
          )}
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
          disabled={captions.length === 0 || isPending}
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
          {t("textGen.generateVisuals")}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
