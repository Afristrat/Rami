"use client"

import { useState, useTransition } from "react"
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle, CheckCircle2, UserPlus, Pencil } from "lucide-react"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"
import type { AdminTenant } from "@/lib/actions/admin.actions"
import { updateTenantPlan } from "@/lib/actions/admin.actions"
import { ProvisionClientDialog } from "./provision-client-dialog"
import { EditTenantDialog } from "./edit-tenant-dialog"
import { ConfirmDialog } from "./confirm-dialog"

const PLAN_OPTIONS = ["free", "solo", "pro", "agency", "agency_plus", "enterprise"] as const
type Plan = typeof PLAN_OPTIONS[number]

const PLAN_BADGE: Record<Plan, string> = {
  free:        "text-muted-foreground bg-muted border-border",
  solo:        "text-blue-400 bg-blue-500/10 border-blue-500/20",
  pro:         "text-violet-400 bg-violet-500/10 border-violet-500/20",
  agency:      "text-orange-400 bg-orange-500/10 border-orange-500/20",
  agency_plus: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  enterprise:  "text-rose-400 bg-rose-500/10 border-rose-500/20",
}

const PLAN_LABELS: Record<Plan, string> = {
  free:        "Free",
  solo:        "Solo",
  pro:         "Pro",
  agency:      "Agency",
  agency_plus: "Agency+",
  enterprise:  "Enterprise",
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

type Props = {
  initialTenants: AdminTenant[]
  initialTotal: number
}

const PAGE_SIZE = 20

export function TenantsTable({ initialTenants, initialTotal }: Props) {
  const t = useTranslations("admin")
  const intlLocale = useIntlLocale()
  const [tenants, setTenants] = useState(initialTenants)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [planUpdating, setPlanUpdating] = useState<string | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)
  const [planSuccess, setPlanSuccess] = useState<string | null>(null)
  const [provisionOpen, setProvisionOpen] = useState(false)
  const [editTenant, setEditTenant] = useState<AdminTenant | null>(null)
  const [confirmState, setConfirmState] = useState<{ tenantId: string; newPlan: string } | null>(null)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function loadTenants(newPage: number, newSearch: string) {
    startTransition(async () => {
      try {
        const { getAdminTenants } = await import("@/lib/actions/admin.actions")
        const result = await getAdminTenants(newPage, newSearch)
        if ("data" in result) {
          setTenants(result.data.tenants)
          setTotal(result.data.total)
        }
      } catch {
        // Ignore
      }
    })
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
    loadTenants(1, value)
  }

  function handlePage(newPage: number) {
    setPage(newPage)
    loadTenants(newPage, search)
  }

  function handlePlanChange(tenantId: string, newPlan: string) {
    setConfirmState({ tenantId, newPlan })
  }

  async function executePlanChange(tenantId: string, newPlan: string) {
    setConfirmState(null)
    setPlanUpdating(tenantId)
    setPlanError(null)
    setPlanSuccess(null)

    const result = await updateTenantPlan(tenantId, newPlan)

    setPlanUpdating(null)

    if ("error" in result) {
      setPlanError(result.error)
      return
    }

    setPlanSuccess(tenantId)
    setTenants((prev) =>
      prev.map((tenant) => (tenant.id === tenantId ? { ...tenant, plan: newPlan } : tenant))
    )

    setTimeout(() => setPlanSuccess(null), 2000)
  }

  function handleProvisionCreated(tenantId: string, email: string, tenantName: string, plan: string) {
    const newTenant: AdminTenant = {
      id: tenantId,
      name: tenantName,
      slug: tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      plan,
      owner_email: email,
      subscription_status: null,
      generation_count: 0,
      created_at: new Date().toISOString(),
    }
    setTenants((prev) => [newTenant, ...prev])
    setTotal((prev) => prev + 1)
  }

  return (
    <div>
      {/* Barre de recherche + bouton Provisionner */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder={t("searchByNameOrSlug")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <span className="text-sm text-muted-foreground flex-1">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin text-violet-400" />
          ) : (
            `${total} tenant${total > 1 ? "s" : ""}`
          )}
        </span>
        <button
          type="button"
          onClick={() => setProvisionOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-2 text-xs font-medium text-white transition-colors"
        >
          <UserPlus className="size-3.5" />
          {t("provisionClient")}
        </button>
      </div>

      <ProvisionClientDialog
        open={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        onCreated={handleProvisionCreated}
      />

      <ConfirmDialog
        open={confirmState !== null}
        title={t("changePlan")}
        description={
          confirmState
            ? `${t("changePlanDescription")} → ${PLAN_LABELS[confirmState.newPlan as Plan] ?? confirmState.newPlan}`
            : ""
        }
        confirmLabel={t("confirmChange")}
        variant="warning"
        onConfirm={() => {
          if (confirmState) void executePlanChange(confirmState.tenantId, confirmState.newPlan)
        }}
        onCancel={() => setConfirmState(null)}
      />

      <EditTenantDialog
        tenant={editTenant}
        onClose={() => setEditTenant(null)}
        onUpdated={(tenantId, fields) => {
          setTenants((prev) => prev.map((tenant) => tenant.id === tenantId ? { ...tenant, ...fields } : tenant))
          setEditTenant(null)
        }}
      />

      {/* Erreur / succès */}
      {planError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <AlertCircle className="size-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{planError}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {tenants.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("noTenantFound")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("columnName")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">{t("columnSlug")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("columnPlan")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">{t("columnOwner")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">{t("columnGenerations")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">{t("columnRegistered")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("columnActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((tenant) => {
                const planKey = tenant.plan as Plan
                const badgeClass = PLAN_BADGE[planKey] ?? PLAN_BADGE.free
                const isUpdating = planUpdating === tenant.id
                const isSuccess = planSuccess === tenant.id

                return (
                  <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[160px]">{tenant.name}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="text-xs text-muted-foreground font-mono">{tenant.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                        ) : isUpdating ? (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
                        ) : null}
                        <select
                          value={tenant.plan}
                          onChange={(e) => { void handlePlanChange(tenant.id, e.target.value) }}
                          disabled={isUpdating}
                          className={`text-[11px] font-medium rounded-full border px-2 py-0.5 cursor-pointer bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/50 ${badgeClass}`}
                        >
                          {PLAN_OPTIONS.map((p) => (
                            <option key={p} value={p} className="bg-card text-foreground">
                              {PLAN_LABELS[p]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground truncate max-w-[180px] block">
                        {tenant.owner_email ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {tenant.generation_count.toLocaleString(intlLocale)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{formatDate(tenant.created_at, intlLocale)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditTenant(tenant)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="size-3" />
                        {t("modify")}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1 || isPending}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
              {t("previous")}
            </button>
            <button
              type="button"
              onClick={() => handlePage(page + 1)}
              disabled={page >= totalPages || isPending}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              {t("next")}
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
