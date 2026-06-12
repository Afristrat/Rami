import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getApprovalByToken } from "@/lib/actions/approval.actions"
import { PLATFORM_CONFIG, type Platform } from "@/lib/scheduler/platform-config"
import { ApprovalDecisionPanel } from "@/components/approvals/approval-decision-panel"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

// Page PUBLIQUE d'approbation externe (LOT 1 Step 6) — accessible sans compte,
// authentifiée par le token capability de l'URL. Jamais indexée.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function ApprovePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [view, t] = await Promise.all([getApprovalByToken(token), getTranslations("approvePage")])

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-xl space-y-6">
        {/* En-tête */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
            {t("brandLine")}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("title")}
          </h1>
          {view.state === "pending" && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("subtitle")}</p>
          )}
        </div>

        {/* États non actionnables */}
        {view.state === "not_found" && (
          <StatusCard icon={<AlertCircle className="size-8 text-red-500" />} message={t("notFound")} />
        )}
        {view.state === "expired" && (
          <StatusCard icon={<Clock className="size-8 text-amber-500" />} message={t("expired")} />
        )}
        {view.state === "approved" && (
          <StatusCard
            icon={<CheckCircle2 className="size-8 text-green-500" />}
            message={t("alreadyApproved")}
          />
        )}
        {view.state === "rejected" && (
          <StatusCard
            icon={<XCircle className="size-8 text-amber-500" />}
            message={t("alreadyRejected")}
          />
        )}

        {/* Contenu du post */}
        {view.post && view.state !== "not_found" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
            {view.post.tenantName && (
              <div className="border-b border-slate-100 dark:border-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {view.post.tenantName}
              </div>
            )}

            {view.post.mediaUrls[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={view.post.mediaUrls[0]}
                alt={view.post.title ?? t("title")}
                className="w-full max-h-96 object-cover"
              />
            )}

            <div className="space-y-4 p-5">
              {view.post.title && (
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {view.post.title}
                </h2>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {view.post.content}
              </p>

              {view.post.platforms.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    {t("platforms")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {view.post.platforms.map((platform) => {
                      const cfg = PLATFORM_CONFIG[platform as Platform]
                      return (
                        <span
                          key={platform}
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                          style={{ backgroundColor: cfg?.color ?? "#64748B" }}
                        >
                          {cfg?.label ?? platform}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Décision (uniquement si actionnable) */}
        {view.state === "pending" && (
          <ApprovalDecisionPanel
            token={token}
            labels={{
              approve: t("approve"),
              reject: t("reject"),
              commentLabel: t("commentLabel"),
              commentPlaceholder: t("commentPlaceholder"),
              approvedTitle: t("approvedTitle"),
              approvedDesc: t("approvedDesc"),
              rejectedTitle: t("rejectedTitle"),
              rejectedDesc: t("rejectedDesc"),
              decisionError: t("decisionError"),
              submitting: t("submitting"),
            }}
          />
        )}
      </div>
    </main>
  )
}

function StatusCard({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 px-6 py-10 text-center">
      {icon}
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </div>
  )
}
