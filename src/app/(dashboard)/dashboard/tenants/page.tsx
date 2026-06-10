import { redirect } from "next/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import { Building2, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getAdminTenants } from "@/lib/actions/admin.actions"
import { getIntlLocale } from "@/lib/utils/format-locale"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Tenants — RAMI",
  robots: "noindex, nofollow",
}

// ── Plan styles ────────────────────────────────────────────────────────────────

type TenantPlan = "free" | "solo" | "pro" | "agency" | "agency_plus" | "enterprise"

const PLAN_STYLES: Record<TenantPlan, string> = {
  free:         "bg-gray-500/20 text-gray-400 border-gray-500/30",
  solo:         "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pro:          "bg-violet-500/20 text-violet-400 border-violet-500/30",
  agency:       "bg-amber-500/20 text-amber-400 border-amber-500/30",
  agency_plus:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  enterprise:   "bg-rose-500/20 text-rose-400 border-rose-500/30",
}

function planStyleClass(plan: string): string {
  return PLAN_STYLES[plan as TenantPlan] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function TenantsAdminPage() {
  // ── Gate super_admin (pattern identique à (admin)/layout.tsx) ────────────────
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // 1. JWT app_metadata (le plus rapide)
  const isSuperAdminViaJwt = user.app_metadata?.role === "super_admin"

  if (!isSuperAdminViaJwt) {
    // 2. profiles.global_role
    const { data: profile } = await supabase
      .from("profiles")
      .select("global_role")
      .eq("id", user.id)
      .single()

    if (profile?.global_role !== "super_admin") {
      // 3. users.role (fallback Drizzle)
      const { data: dbUser } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (dbUser?.role !== "super_admin") {
        redirect("/dashboard")
      }
    }
  }

  // ── Données réelles via service-role ──────────────────────────────────────────
  const result = await getAdminTenants(1, "")
  const tenants = "data" in result ? result.data.tenants : []
  const total   = "data" in result ? result.data.total   : 0
  const fetchError = "error" in result ? result.error : null

  const t = await getTranslations("tenants")
  const locale = await getLocale()
  const intlLocale = getIntlLocale(locale)

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(intlLocale, {
      day:   "2-digit",
      month: "short",
      year:  "numeric",
    })
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
            {t("adminTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("adminSubtitle", { total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm",
              "border border-gray-200/60 bg-white text-muted-foreground",
              "dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50"
            )}
          >
            <Calendar className="size-4" />
            <span className="text-xs">{t("allTime")}</span>
          </div>
        </div>
      </div>

      {/* Erreur fetch */}
      {fetchError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{fetchError}</p>
        </div>
      )}

      {/* Tableau */}
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          "bg-white border border-gray-200/60 shadow-sm",
          "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
        )}
      >
        {tenants.length === 0 && !fetchError ? (
          <div className="flex flex-col items-center gap-3 py-16 px-5 text-center">
            <Building2 className="size-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t("noTenantsYet")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200/60 dark:border-white/[0.06]">
                  {[
                    t("brandColumn"),
                    t("slugColumn"),
                    t("planColumn"),
                    t("generationsColumn"),
                    t("createdAt"),
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60 dark:divide-white/[0.06]">
                {tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    {/* Nom + email owner */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase shrink-0">
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground dark:text-white">
                            {tenant.name}
                          </p>
                          {tenant.owner_email && (
                            <p className="text-[10px] text-muted-foreground">
                              {tenant.owner_email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-5 py-4">
                      <code className="text-xs text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">
                        {tenant.slug}
                      </code>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider",
                          planStyleClass(tenant.plan)
                        )}
                      >
                        {tenant.plan}
                      </span>
                    </td>

                    {/* Générations ce mois */}
                    <td className="px-5 py-4 font-medium text-foreground dark:text-white">
                      {tenant.generation_count.toLocaleString(intlLocale)}
                    </td>

                    {/* Date de création */}
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(tenant.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer — pagination indicative (page 1, max 20 lignes) */}
        {tenants.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200/60 dark:border-white/[0.06] px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {t("displayingBrands", { shown: tenants.length, total })}
            </p>
            {total > 20 && (
              <p className="text-xs text-muted-foreground">
                {t("paginationNote")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
