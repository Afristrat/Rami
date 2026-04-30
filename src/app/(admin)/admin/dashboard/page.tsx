import { LayoutDashboard, Users, Building2, TrendingUp, Zap } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { getIntlLocale } from "@/lib/utils/format-locale"
import { getAdminStats } from "@/lib/actions/admin.actions"

export const metadata = {
  title: "Dashboard — Admin RAMI",
  robots: "noindex, nofollow",
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:        { label: "Free",       color: "text-muted-foreground" },
  solo:        { label: "Solo",       color: "text-blue-400" },
  pro:         { label: "Pro",        color: "text-violet-400" },
  agency:      { label: "Agency",     color: "text-orange-400" },
  agency_plus: { label: "Agency+",    color: "text-amber-400" },
  enterprise:  { label: "Enterprise", color: "text-rose-400" },
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatMRR(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}

export default async function AdminDashboardPage() {
  const result = await getAdminStats()
  const stats = "data" in result ? result.data : null
  const fetchError = "error" in result ? result.error : null
  const t = await getTranslations("admin")
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <LayoutDashboard className="size-4" />
          <span className="text-sm font-medium">{t("navDashboard")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("overview")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("overviewDescription")}
        </p>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{t("errorPrefix")}{fetchError}</p>
        </div>
      )}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Building2 className="size-3.5 text-violet-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{t("tenants")}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total_tenants}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="size-3.5 text-blue-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{t("users")}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.active_users}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="size-3.5 text-emerald-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{t("mrrEstimate")}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatMRR(stats.mrr_estimate, intlLocale)}</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Zap className="size-3.5 text-orange-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{t("generationsMonth")}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.generations_this_month.toLocaleString(intlLocale)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Répartition des plans */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">{t("planBreakdown")}</h2>
              <div className="space-y-2.5">
                {Object.entries(PLAN_LABELS).map(([plan, { label, color }]) => {
                  const count = stats.plan_breakdown[plan] ?? 0
                  const total = stats.total_tenants
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0

                  return (
                    <div key={plan} className="flex items-center gap-3">
                      <span className={`text-xs font-medium w-20 shrink-0 ${color}`}>{label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-current transition-all"
                          style={{ width: `${pct}%`, color: "inherit" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 10 derniers tenants */}
            <div className="rounded-xl border border-border bg-card overflow-hidden lg:col-span-2">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">{t("recentTenants")}</h2>
              </div>
              <div className="divide-y divide-border">
                {stats.recent_tenants.length === 0 && (
                  <p className="px-5 py-4 text-sm text-muted-foreground">{t("noTenant")}</p>
                )}
                {stats.recent_tenants.map((tenant) => {
                  const planMeta = PLAN_LABELS[tenant.plan] ?? { label: tenant.plan, color: "text-muted-foreground" }
                  return (
                    <div key={tenant.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {tenant.owner_email ?? "—"}
                        </p>
                      </div>
                      <span className={`text-[11px] font-medium shrink-0 ${planMeta.color}`}>
                        {planMeta.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatDate(tenant.created_at, intlLocale)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
