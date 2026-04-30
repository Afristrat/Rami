"use client"

import { useState } from "react"
import type { Step1Data, Step2Data, Step3Data, Step4Data, Step5Data } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG, type Platform } from "@/lib/scheduler/platform-config"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Image as ImageIcon, Hash, Link2, CheckCircle2, BarChart3, Type, Eye, RefreshCw, Shield } from "lucide-react"
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

interface Step5ReviewProps {
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
  defaultValues?: Step5Data | null
  onBack: () => void
  onNext: (data: Step5Data) => void
}

export function Step5Review({ step1: _step1, step2, step3, step4, defaultValues, onBack, onNext }: Step5ReviewProps) {
  const t = useTranslations("workflow")
  const tc = useTranslations("common")

  const QUALITY_METRICS = [
    { label: t("review.charCount"), icon: Type, status: "good" as const },
    { label: t("review.brandDnaScore"), icon: Shield, status: "good" as const },
    { label: t("review.hashtagVolume"), icon: Hash, status: "good" as const },
    { label: t("review.ctaDetection"), icon: CheckCircle2, status: "good" as const },
    { label: t("review.imageResolution"), icon: ImageIcon, status: "good" as const },
    { label: t("review.colorContrast"), icon: Eye, status: "warn" as const },
  ]

  const firstCaption = step3.captions[step3.selectedCaptionIndex] ?? step3.captions[0]
  const selectedVisual = step4.visuals.find((v) => v.id === step4.selectedVisualId)

  const [finalCaption, setFinalCaption] = useState(
    defaultValues?.finalCaption ?? firstCaption?.caption ?? ""
  )
  const [finalHashtags, setFinalHashtags] = useState<string[]>(
    defaultValues?.finalHashtags ?? firstCaption?.hashtags ?? []
  )
  const [finalVisualUrl, setFinalVisualUrl] = useState<string | null>(
    defaultValues?.finalVisualUrl ?? selectedVisual?.url ?? null
  )
  const [notes, _setNotes] = useState(defaultValues?.notes ?? "")
  const [activePlatform, setActivePlatform] = useState(step2.platforms[0])

  function handleNext() {
    onNext({ finalCaption, finalHashtags, finalVisualUrl, notes })
  }

  const activePlatformConfig = PLATFORM_CONFIG[activePlatform]

  return (
    <div className="space-y-6">
      {/* Platform tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {step2.platforms.map((platform) => {
          const cfg = PLATFORM_CONFIG[platform]
          return (
            <button
              key={platform}
              type="button"
              onClick={() => {
                setActivePlatform(platform)
                const cap = step3.captions.find((c) => c.platform === platform)
                if (cap) {
                  setFinalCaption(cap.caption)
                  setFinalHashtags(cap.hashtags)
                }
              }}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Phone preview + caption */}
        <div className="lg:col-span-3 space-y-4">
          {/* Phone mockup preview */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-white/[0.05] bg-white dark:bg-slate-900/50 overflow-hidden">
            {/* Visual */}
            {finalVisualUrl ? (
              <div className="aspect-[4/5] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={finalVisualUrl}
                  alt={t("review.visualSelected")}
                  className="size-full object-cover"
                />
                {/* Overlay action */}
                <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFinalVisualUrl(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium backdrop-blur-sm hover:bg-black/80 transition-all"
                  >
                    <RefreshCw className="size-3" />
                    {t("review.changeVisual")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/5] flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-white/[0.02]">
                <ImageIcon className="size-10 text-slate-300 dark:text-slate-600" />
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                  {t("review.noVisualSelected")}
                  {step4.visuals.length > 0 && (
                    <><br />
                      <button
                        type="button"
                        onClick={() => {
                          const first = step4.visuals[0]
                          if (first) setFinalVisualUrl(first.url)
                        }}
                        className="text-violet-500 hover:underline mt-1"
                      >
                        {t("review.useFirstVisual")}
                      </button>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Caption under visual */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                  {t("textGen.postCaption")}
                </span>
                <span className={cn(
                  "text-[10px] font-mono",
                  finalCaption.length > (activePlatformConfig?.charLimit ?? 9999)
                    ? "text-red-500"
                    : "text-slate-400 dark:text-slate-500"
                )}>
                  {finalCaption.length} / {activePlatformConfig?.charLimit?.toLocaleString()}
                </span>
              </div>
              <textarea
                value={finalCaption}
                onChange={(e) => setFinalCaption(e.target.value)}
                rows={4}
                className={cn(
                  "w-full bg-slate-50 dark:bg-white/[0.03] border-0 rounded-xl p-3 text-sm resize-none",
                  "text-slate-800 dark:text-slate-200 placeholder:text-slate-400",
                  "focus:ring-2 focus:ring-violet-500/40 outline-none transition-all"
                )}
              />

              {/* Hashtags */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{t("review.suggestedHashtags")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {finalHashtags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFinalHashtags((prev) => prev.filter((t) => t !== tag))}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                        "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
                        "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                      )}
                      title={tc("delete")}
                    >
                      #{tag.replace(/^#/, "")}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="rounded-full px-2.5 py-0.5 text-xs text-violet-500 border border-dashed border-violet-500/30 hover:bg-violet-500/10 transition-colors"
                  >
                    {t("review.addHashtag")}
                  </button>
                </div>
              </div>

              {/* UTM params */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.05]">
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <Link2 className="size-3.5" />
                  {t("review.utmParams")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quality metrics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="size-4 text-violet-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("review.contentQuality")}</h4>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{t("review.aiAnalysis")}</p>

            {/* AI Score */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative size-20">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-slate-100 dark:text-white/[0.05]"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="85, 100"
                    className="text-violet-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">A+</span>
                </div>
              </div>
            </div>

            {/* Metrics list */}
            <div className="space-y-3">
              {QUALITY_METRICS.map((metric) => {
                const Icon = metric.icon
                return (
                  <div key={metric.label} className="flex items-center gap-3">
                    <div className={cn(
                      "size-2 rounded-full",
                      metric.status === "good" ? "bg-green-500" : "bg-amber-500"
                    )} />
                    <Icon className="size-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{metric.label}</span>
                    <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                      <div className={cn(
                        "h-full rounded-full",
                        metric.status === "good" ? "bg-green-500 w-[85%]" : "bg-amber-500 w-[60%]"
                      )} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick action */}
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              "w-full px-6 py-3 rounded-xl",
              "bg-gradient-to-r from-violet-600 to-blue-600",
              "text-white text-sm font-bold",
              "shadow-lg shadow-violet-500/20",
              "hover:scale-[1.02] active:scale-[0.98] transition-all",
              "flex items-center justify-center gap-2"
            )}
          >
            {t("review.scheduleDirect")}
            <ArrowRight className="size-4" />
          </button>

          <button
            type="button"
            className="w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2"
          >
            {t("review.saveDraft")}
          </button>
        </div>
      </div>

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
          className={cn(
            "px-8 py-2.5 rounded-xl",
            "bg-gradient-to-r from-violet-600 to-blue-600",
            "text-white text-sm font-bold",
            "shadow-lg shadow-violet-500/20",
            "hover:scale-[1.02] active:scale-[0.98] transition-all",
            "flex items-center gap-2"
          )}
        >
          {t("review.submitApproval")}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
