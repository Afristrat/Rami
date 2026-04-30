"use client"

import { useState } from "react"
import type { Step1Data, Step2Data, Step5Data, Step6Data } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG, type Platform } from "@/lib/scheduler/platform-config"
import { cn } from "@/lib/utils"
import { ArrowLeft, XCircle, Send, Users, Clock, Shield } from "lucide-react"
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

interface Step6ApprovalProps {
  step1: Step1Data
  step2: Step2Data
  step5: Step5Data
  onBack: () => void
  onNext: (data: Step6Data) => void
}

export function Step6Approval({ step1: _step1, step2, step5, onBack, onNext }: Omit<Step6ApprovalProps, "defaultValues">) {
  const t = useTranslations("workflow")
  const tc = useTranslations("common")
  const [decision, setDecision] = useState<boolean | null>(null)

  function handleApprove() {
    setDecision(true)
    onNext({ approved: true, approvedAt: new Date().toISOString() })
  }

  function handleReject() {
    setDecision(false)
    onBack()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Content previews */}
        <div className="lg:col-span-3 space-y-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400">
            {t("approval.contentPreview")}
          </h4>

          {/* Post previews per platform */}
          {step2.platforms.map((platform) => {
            const cfg = PLATFORM_CONFIG[platform]
            return (
              <div
                key={platform}
                className="rounded-2xl border border-slate-200 dark:border-white/[0.05] bg-white dark:bg-slate-900/50 overflow-hidden"
              >
                {/* Platform header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-6 items-center justify-center rounded text-white"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {(() => { const I = PLATFORM_ICON_MAP[platform]; return <I className="size-3.5" /> })()}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Post {cfg.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase">
                    {t("approval.ready")}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Visual */}
                  {step5.finalVisualUrl && (
                    <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-white/[0.05]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={step5.finalVisualUrl}
                        alt={`Visuel ${cfg.label}`}
                        className="w-full object-cover max-h-64"
                      />
                    </div>
                  )}

                  {/* Caption */}
                  <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] p-3">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 line-clamp-6">
                      {step5.finalCaption}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {step5.finalHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {step5.finalHashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400"
                        >
                          #{tag.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: Approval panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-5 backdrop-blur-sm sticky top-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-400 mb-4">
              {t("approval.approvalParams")}
            </h4>

            {/* Approver */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                <div className="size-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Users className="size-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{t("approval.approverTeam")}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{t("approval.designatedApprover")}</p>
                </div>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                {t("approval.externalApprovalLink")}
              </p>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                <input
                  type="text"
                  readOnly
                  value="rami.ai-mpower.com/approve/..."
                  className="flex-1 bg-transparent text-[11px] text-slate-400 dark:text-slate-500 outline-none"
                />
                <button
                  type="button"
                  className="px-2 py-1 rounded bg-violet-500/10 text-violet-500 text-[10px] font-bold"
                >
                  {t("approval.copy")}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <button
              type="button"
              onClick={handleApprove}
              disabled={decision !== null}
              className={cn(
                "w-full px-6 py-3 rounded-xl mb-3",
                "bg-gradient-to-r from-violet-600 to-blue-600",
                "text-white text-sm font-bold",
                "shadow-lg shadow-violet-500/20",
                "hover:scale-[1.02] active:scale-[0.98] transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                "flex items-center justify-center gap-2",
                decision === true && "bg-green-600 from-green-600 to-green-600"
              )}
            >
              <Send className="size-4" />
              {decision === true ? t("approval.approved") : t("approval.sendForApproval")}
            </button>

            <button
              type="button"
              onClick={handleReject}
              disabled={decision !== null}
              className={cn(
                "w-full px-6 py-2.5 rounded-xl",
                "border border-red-200 dark:border-red-800/30",
                "text-red-600 dark:text-red-400 text-sm font-semibold",
                "hover:bg-red-50 dark:hover:bg-red-900/20 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              <XCircle className="size-4" />
              {t("approval.reviseContent")}
            </button>

            {/* Status info */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.05] space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Clock className="size-3" />
                <span>{t("approval.noSubmission")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Shield className="size-3" />
                <span>{t("approval.securedLink")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
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
        <div className="text-xs text-slate-400 dark:text-slate-500">
          {t("approval.approvalNote")}
        </div>
      </div>
    </div>
  )
}
