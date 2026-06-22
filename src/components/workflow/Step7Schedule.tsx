"use client"

import { useState, useTransition } from "react"
import { saveWorkflowPostAction } from "@/lib/actions/workflow.actions"
import { suggestOptimalTime, toDatetimeLocalValue } from "@/lib/services/workflow/optimal-time"
import type { Step1Data, Step2Data, Step5Data, Step6Data, Step7Data, WorkflowState } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG, type Platform } from "@/lib/scheduler/platform-config"
import { cn } from "@/lib/utils"
import { ArrowLeft, CalendarCheck, Zap, Save, CheckCircle2, ExternalLink, Sparkles, Calendar } from "lucide-react"
import {
  TwitterXIcon, LinkedInIcon, InstagramIcon, FacebookIcon,
  PinterestIcon, YouTubeIcon, MastodonIcon, TikTokIcon,
} from "@/components/connections/platform-icons"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"

const PLATFORM_ICON_MAP: Record<Platform, React.ComponentType<{ className?: string }>> = {
  twitter: TwitterXIcon, linkedin: LinkedInIcon, instagram: InstagramIcon,
  facebook: FacebookIcon, pinterest: PinterestIcon, youtube: YouTubeIcon,
  mastodon: MastodonIcon, tiktok: TikTokIcon,
}
import { useRouter } from "next/navigation"

interface Step7ScheduleProps {
  step1: Step1Data
  step2: Step2Data
  step5: Step5Data
  /** Données du Step 6 — porte le post déjà créé via le lien d'approbation externe. */
  step6?: Step6Data | null
  defaultValues?: Step7Data | null
  /** Post édité (Option B) — prioritaire sur l'éventuel post du Step 6. */
  existingPostId?: string | null
  /** Snapshot complet du parcours, persisté sur le post pour réouverture riche. */
  workflowState?: WorkflowState | null
  onBack: () => void
  /** Appelé quand le post final est sauvegardé — clôt la session de brouillon. */
  onPublished?: () => void
}

export function Step7Schedule({ step1, step2, step5, step6, defaultValues, existingPostId, workflowState, onBack, onPublished }: Step7ScheduleProps) {
  const t = useTranslations("workflow.schedule")
  const tc = useTranslations("common")
  const intlLocale = useIntlLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [publishMode, setPublishMode] = useState<"now" | "scheduled" | "draft">(
    defaultValues?.publishMode === "scheduled" ? "scheduled" : "now"
  )
  const [scheduledAt, setScheduledAt] = useState<string>(defaultValues?.scheduledAt ?? "")
  const [error, setError] = useState<string | null>(null)
  const [savedPostId, setSavedPostId] = useState<string | null>(null)
  // Date minimum calculee une fois au montage du composant
  const [minDate] = useState(() =>
    new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)
  )
  // Référence stable pour la suggestion d'horaire (heuristique réelle, déterministe)
  const [suggestionFrom] = useState(() => new Date())
  const primaryPlatform = step2.platforms[0]
  const suggestedTime = primaryPlatform
    ? suggestOptimalTime({ platform: primaryPlatform, objective: step1.objectif, from: suggestionFrom })
    : null

  function handleSave() {
    setError(null)

    if (publishMode === "scheduled" && (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime()))) {
      setError(t("selectDateError"))
      return
    }

    startTransition(async () => {
      const result = await saveWorkflowPostAction({
        step1,
        step2,
        finalCaption: step5.finalCaption,
        finalHashtags: step5.finalHashtags,
        finalVisualUrl: step5.finalVisualUrl,
        // datetime-local (heure locale, sans offset) → ISO complet attendu par le schéma serveur
        scheduledAt: publishMode === "scheduled" ? new Date(scheduledAt).toISOString() : null,
        status: publishMode === "draft" ? "draft" : publishMode === "scheduled" ? "scheduled" : "approved",
        // Post édité (Option B) ou post créé au Step 6 → mise à jour, pas de doublon.
        existingPostId: existingPostId ?? step6?.approvalPostId ?? null,
        workflowState,
      })

      if (result.success) {
        setSavedPostId(result.postId)
        onPublished?.()
      } else {
        setError(result.error)
      }
    })
  }

  // Etat succes
  if (savedPostId) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10 border-2 border-green-500/20">
          <CheckCircle2 className="size-10 text-green-500" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("contentScheduled")}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {publishMode === "scheduled"
              ? t("postScheduled")
              : publishMode === "draft"
              ? t("postSavedDraft")
              : t("postPublishing")}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={() => router.push("/dashboard/calendar")}
            className={cn(
              "w-full px-6 py-3 rounded-xl",
              "bg-gradient-to-r from-violet-600 to-blue-600",
              "text-white text-sm font-bold",
              "shadow-lg shadow-violet-500/20",
              "hover:scale-[1.02] active:scale-[0.98] transition-all",
              "flex items-center justify-center gap-2"
            )}
          >
            <CalendarCheck className="size-4" />
            {t("viewCalendar")}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/calendar?postId=${savedPostId}`)}
            className={cn(
              "w-full px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10",
              "text-sm font-semibold text-slate-700 dark:text-slate-300",
              "hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all",
              "flex items-center justify-center gap-2"
            )}
          >
            <ExternalLink className="size-4" />
            {t("viewPost")}
          </button>
          <button
            type="button"
            onClick={() => {
              setSavedPostId(null)
              router.push("/dashboard/create")
            }}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-violet-500 transition-colors py-2"
          >
            {t("createNewContent")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Publication mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            value: "now" as const,
            label: t("publishNow"),
            desc: t("publishNowDesc"),
            icon: Zap,
            activeGradient: "from-green-500 to-emerald-600",
          },
          {
            value: "scheduled" as const,
            label: t("schedule"),
            desc: t("scheduleDesc"),
            icon: CalendarCheck,
            activeGradient: "from-violet-600 to-blue-600",
          },
          {
            value: "draft" as const,
            label: t("saveDraft"),
            desc: t("saveDraftDesc"),
            icon: Save,
            activeGradient: "from-slate-500 to-slate-600",
          },
        ].map((mode) => {
          const Icon = mode.icon
          const isActive = publishMode === mode.value
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => setPublishMode(mode.value)}
              className={cn(
                "flex flex-col gap-3 rounded-2xl p-5 text-left transition-all",
                isActive
                  ? "border-2 border-violet-500 bg-violet-500/5 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                  : "border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-violet-500/50"
              )}
            >
              <div className={cn(
                "size-10 rounded-xl flex items-center justify-center",
                isActive
                  ? `bg-gradient-to-br ${mode.activeGradient}`
                  : "bg-slate-100 dark:bg-white/[0.06]"
              )}>
                <Icon className={cn(
                  "size-5",
                  isActive ? "text-white" : "text-slate-400 dark:text-slate-500"
                )} />
              </div>
              <div>
                <p className={cn(
                  "text-sm font-bold",
                  isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"
                )}>
                  {mode.label}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{mode.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Scheduled date picker */}
      {publishMode === "scheduled" && (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="size-4 text-violet-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("timeConfig")}</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("date")}</label>
              <input
                type="date"
                value={scheduledAt?.split("T")[0] ?? ""}
                min={minDate.split("T")[0]}
                onChange={(e) => {
                  const time = scheduledAt?.split("T")[1] ?? "09:15"
                  setScheduledAt(`${e.target.value}T${time}`)
                }}
                className={cn(
                  "w-full bg-slate-50 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10",
                  "rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100",
                  "focus:ring-2 focus:ring-violet-500/40 outline-none transition-all"
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{t("time")}</label>
              <input
                type="time"
                value={scheduledAt?.split("T")[1] ?? "09:15"}
                onChange={(e) => {
                  const date = scheduledAt?.split("T")[0] ?? new Date().toISOString().split("T")[0]
                  setScheduledAt(`${date}T${e.target.value}`)
                }}
                className={cn(
                  "w-full bg-slate-50 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10",
                  "rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100",
                  "focus:ring-2 focus:ring-violet-500/40 outline-none transition-all"
                )}
              />
            </div>
          </div>

          {/* Suggestion d'horaire RÉELLE — heuristique fenêtres d'engagement par plateforme */}
          {suggestedTime && primaryPlatform && (
            <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-3.5 text-violet-500" />
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{t("bestTimeHeuristic")}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {t("bestTimeDetail", {
                  platform: PLATFORM_CONFIG[primaryPlatform].label,
                  datetime: suggestedTime.toLocaleString(intlLocale, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </p>
              <button
                type="button"
                onClick={() => setScheduledAt(toDatetimeLocalValue(suggestedTime))}
                className="mt-2 px-3 py-1 rounded-lg bg-violet-500/10 text-violet-500 text-[10px] font-bold hover:bg-violet-500/20 transition-colors"
              >
                {t("useSuggestion")}
              </button>
            </div>
          )}

          {scheduledAt && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {t("scheduledFor")}{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {new Date(scheduledAt).toLocaleString(intlLocale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </p>
          )}
        </div>
      )}

      {/* Publication recap */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-5 backdrop-blur-sm">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-4">
          {t("publicationRecap")}
        </h4>
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-white/[0.05]">
            <span>{t("platform")}</span>
            <span>{t("dateTime")}</span>
            <span className="col-span-2 text-right">{tc("status")}</span>
          </div>
          {step2.platforms.map((platform) => {
            const cfg = PLATFORM_CONFIG[platform]
            return (
              <div key={platform} className="grid grid-cols-4 gap-2 items-center py-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const I = PLATFORM_ICON_MAP[platform]
                    return (
                      <span className="flex size-5 items-center justify-center rounded" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                        <I className="size-3.5" />
                      </span>
                    )
                  })()}
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cfg.label}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {scheduledAt
                    ? new Date(scheduledAt).toLocaleDateString(intlLocale, { day: "numeric", month: "short", year: "numeric" })
                    : t("now")
                  }
                </span>
                <div className="col-span-2 flex justify-end">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    publishMode === "draft"
                      ? "bg-slate-100 dark:bg-white/[0.05] text-slate-500"
                      : "bg-green-500/10 text-green-600 dark:text-green-400"
                  )}>
                    {publishMode === "draft" ? tc("draft") : tc("ready")}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/10">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className={cn(
            "flex items-center gap-2 text-xs font-medium",
            "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          )}
        >
          <ArrowLeft className="size-4" />
          {t("backToPrevious")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={cn(
            "px-8 py-3 rounded-xl",
            "bg-gradient-to-r from-violet-600 to-blue-600",
            "text-white text-sm font-bold",
            "shadow-lg shadow-violet-500/20",
            "hover:scale-[1.02] active:scale-[0.98] transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            "flex items-center gap-2"
          )}
        >
          {isPending ? (
            <>
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t("saving")}
            </>
          ) : (
            <>
              <CalendarCheck className="size-4" />
              {t("confirmPublication")}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
