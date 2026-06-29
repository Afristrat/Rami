"use client"

import { useState, useTransition } from "react"
import type { Step1Data, Step2Data, Step3Data, Step4Data, Step5Data, WorkflowState } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG, type Platform } from "@/lib/scheduler/platform-config"
import { computeQualityScore, HASHTAG_RANGES, type QualityMetricId } from "@/lib/services/workflow/quality-score"
import { saveWorkflowPostAction } from "@/lib/actions/workflow.actions"
import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Image as ImageIcon, Hash, CheckCircle2, BarChart3, Type, RefreshCw, Shield, Loader2 } from "lucide-react"
import {
  TwitterXIcon, LinkedInIcon, InstagramIcon, FacebookIcon,
  PinterestIcon, YouTubeIcon, TikTokIcon,
} from "@/components/connections/platform-icons"
import { useTranslations } from "next-intl"

const PLATFORM_ICON_MAP: Record<Platform, React.ComponentType<{ className?: string }>> = {
  twitter: TwitterXIcon, linkedin: LinkedInIcon, instagram: InstagramIcon,
  facebook: FacebookIcon, pinterest: PinterestIcon, youtube: YouTubeIcon,
  tiktok: TikTokIcon,
}

const METRIC_ICONS: Record<QualityMetricId, React.ComponentType<{ className?: string }>> = {
  charCount: Type,
  brandDnaScore: Shield,
  hashtagVolume: Hash,
  ctaDetection: CheckCircle2,
}

interface Step5ReviewProps {
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
  defaultValues?: Step5Data | null
  /** Post édité (Option B) — mis à jour au lieu d'être dupliqué. */
  existingPostId?: string | null
  /** Snapshot complet du parcours, persisté sur le post pour réouverture riche. */
  workflowState?: WorkflowState | null
  onBack: () => void
  onNext: (data: Step5Data) => void
}

export function Step5Review({ step1, step2, step3, step4, defaultValues, existingPostId, workflowState, onBack, onNext }: Step5ReviewProps) {
  const t = useTranslations("workflow")
  const tc = useTranslations("common")

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

  // Ajout de hashtag (bouton « + Ajouter » réellement câblé)
  const [addingTag, setAddingTag] = useState(false)
  const [tagInput, setTagInput] = useState("")

  // Enregistrement réel en brouillon (saveWorkflowPostAction status=draft)
  const [isSavingDraft, startSavingDraft] = useTransition()
  const [draftState, setDraftState] = useState<"idle" | "saved" | "error">("idle")

  function handleNext() {
    onNext({ finalCaption, finalHashtags, finalVisualUrl, notes })
  }

  function commitTagInput() {
    const cleaned = tagInput.trim().replace(/^#/, "")
    if (cleaned.length > 0 && !finalHashtags.includes(cleaned)) {
      setFinalHashtags((prev) => [...prev, cleaned])
    }
    setTagInput("")
    setAddingTag(false)
  }

  function handleSaveDraft() {
    setDraftState("idle")
    startSavingDraft(async () => {
      const result = await saveWorkflowPostAction({
        step1,
        step2,
        finalCaption,
        finalHashtags,
        finalVisualUrl,
        scheduledAt: null,
        status: "draft",
        existingPostId,
        workflowState,
      })
      setDraftState(result.success ? "saved" : "error")
    })
  }

  const activePlatformConfig = PLATFORM_CONFIG[activePlatform]
  const charLimit = activePlatformConfig?.charLimit ?? 9999

  // Score qualité RÉEL — calculé sur le contenu en cours (fin du « A+ » inventé)
  const visualForScore = finalVisualUrl
    ? step4.visuals.find((v) => v.url === finalVisualUrl) ?? null
    : null
  const quality = computeQualityScore({
    caption: finalCaption,
    hashtags: finalHashtags,
    charLimit,
    platform: activePlatform,
    visualBrandDnaScore: visualForScore ? visualForScore.brandDnaScore : null,
  })
  const [tagMin, tagMax] = HASHTAG_RANGES[activePlatform]

  const metricDetails: Record<QualityMetricId, string> = {
    charCount: `${finalCaption.trim().length}/${charLimit.toLocaleString()}`,
    brandDnaScore: visualForScore
      ? `${Math.round(visualForScore.brandDnaScore * 100)}%${visualForScore.visionScored === false ? " ≈" : ""}`
      : t("review.noVisualMetric"),
    hashtagVolume: `${finalHashtags.length} (${tagMin}–${tagMax})`,
    ctaDetection: quality.metrics.find((m) => m.id === "ctaDetection")?.ratio === 1
      ? t("review.ctaFound")
      : t("review.ctaMissing"),
  }

  const metricLabels: Record<QualityMetricId, string> = {
    charCount: t("review.charCount"),
    brandDnaScore: t("review.brandDnaScore"),
    hashtagVolume: t("review.hashtagVolume"),
    ctaDetection: t("review.ctaDetection"),
  }

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
                  quality.overLimit
                    ? "text-red-500"
                    : "text-slate-400 dark:text-slate-500"
                )}>
                  {finalCaption.length} / {charLimit.toLocaleString()}
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
                  {addingTag ? (
                    <input
                      autoFocus
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onBlur={commitTagInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          commitTagInput()
                        } else if (e.key === "Escape") {
                          setTagInput("")
                          setAddingTag(false)
                        }
                      }}
                      placeholder={t("review.hashtagPlaceholder")}
                      className="w-28 rounded-full px-2.5 py-0.5 text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30 outline-none focus:ring-1 focus:ring-violet-500/40"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingTag(true)}
                      className="rounded-full px-2.5 py-0.5 text-xs text-violet-500 border border-dashed border-violet-500/30 hover:bg-violet-500/10 transition-colors"
                    >
                      {t("review.addHashtag")}
                    </button>
                  )}
                </div>
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
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{t("review.qualityChecks")}</p>

            {/* Score qualité RÉEL (longueur, Brand DNA visuel, hashtags, CTA) */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative size-20" title={`${quality.score}/100`}>
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
                    strokeDasharray={`${quality.score}, 100`}
                    className={cn(
                      quality.score >= 75
                        ? "text-violet-500"
                        : quality.score >= 45
                        ? "text-amber-500"
                        : "text-red-500"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{quality.grade}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">{quality.score}/100</span>
                </div>
              </div>
            </div>

            {/* Avertissement limite dépassée */}
            {quality.overLimit && (
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                {t("review.overLimit", { limit: charLimit.toLocaleString() })}
              </p>
            )}

            {/* Metrics list — jauges réelles */}
            <div className="space-y-3">
              {quality.metrics.map((metric) => {
                const Icon = METRIC_ICONS[metric.id]
                return (
                  <div key={metric.id} className="flex items-center gap-3">
                    <div className={cn(
                      "size-2 rounded-full",
                      metric.status === "good"
                        ? "bg-green-500"
                        : metric.status === "warn"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    )} />
                    <Icon className="size-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{metricLabels[metric.id]}</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{metricDetails[metric.id]}</span>
                    <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          metric.status === "good"
                            ? "bg-green-500"
                            : metric.status === "warn"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        )}
                        style={{ width: `${Math.round(metric.ratio * 100)}%` }}
                      />
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

          {/* Enregistrement réel en brouillon */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || finalCaption.trim().length === 0}
            className={cn(
              "w-full flex items-center justify-center gap-2 text-center text-xs py-2 transition-colors",
              "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSavingDraft && <Loader2 className="size-3 animate-spin" />}
            {t("review.saveDraft")}
          </button>
          {draftState === "saved" && (
            <p className="text-center text-xs text-green-600 dark:text-green-400">
              {t("review.draftSaved")}
            </p>
          )}
          {draftState === "error" && (
            <p className="text-center text-xs text-red-500">
              {t("review.draftSaveError")}
            </p>
          )}
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
