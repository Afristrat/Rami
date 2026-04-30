"use client"

import { useState, useTransition, useEffect } from "react"
import { useTranslations } from "next-intl"
import { X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { updateTenantAction } from "@/lib/actions/admin.actions"
import type { AdminTenant } from "@/lib/actions/admin.actions"
import { slugify } from "@/lib/utils/slugify"

const PLAN_OPTIONS = [
  { value: "free",        label: "Free",       color: "text-muted-foreground border-border" },
  { value: "solo",        label: "Solo",       color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { value: "pro",         label: "Pro",        color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
  { value: "agency",      label: "Agency",     color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  { value: "agency_plus", label: "Agency+",    color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { value: "enterprise",  label: "Enterprise", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
] as const

type Props = {
  tenant: AdminTenant | null
  onClose: () => void
  onUpdated: (tenantId: string, fields: Partial<AdminTenant>) => void
}

export function EditTenantDialog({ tenant, onClose, onUpdated }: Props) {
  const [isPending, startTransition] = useTransition()

  const t = useTranslations("admin")
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManual, setSlugManual] = useState(false)
  const [plan, setPlan] = useState("free")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (tenant) {
      queueMicrotask(() => {
        setName(tenant.name)
        setSlug(tenant.slug)
        setPlan(tenant.plan)
        setSlugManual(false)
        setError(null)
        setSuccess(null)
      })
    }
  }, [tenant])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManual) setSlug(slugify(value))
  }

  function handleClose() {
    if (isPending) return
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenant) return
    setError(null)
    setSuccess(null)

    // Ne soumettre que les champs modifiés
    const fields: Parameters<typeof updateTenantAction>[1] = {}
    if (name.trim() !== tenant.name) fields.name = name.trim()
    if (slug !== tenant.slug) fields.slug = slug
    if (plan !== tenant.plan) fields.plan = plan

    if (Object.keys(fields).length === 0) {
      setSuccess(t("noChangeDetected"))
      return
    }

    startTransition(async () => {
      const result = await updateTenantAction(tenant.id, fields)

      if ("error" in result) {
        setError(result.error)
        return
      }

      setSuccess(t("tenantUpdated"))
      onUpdated(tenant.id, {
        name: name.trim(),
        slug,
        plan,
      })
    })
  }

  if (!tenant) return null

  const slugChanged = slug !== tenant.slug

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} aria-hidden />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("editTenant")}</h2>
            <p className="text-xs text-muted-foreground font-mono">{tenant.slug}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-5 space-y-4">

            {/* Nom */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {t("workspaceName")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">
                  Slug
                </label>
                {slugManual && (
                  <button
                    type="button"
                    onClick={() => { setSlugManual(false); setSlug(slugify(name)) }}
                    className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <RefreshCw className="size-2.5" />
                    Regénérer
                  </button>
                )}
              </div>
              <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/50">
                <span className="px-3 text-xs text-muted-foreground border-r border-border py-2 bg-muted/50 shrink-0">
                  rami.ai/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => { setSlugManual(true); setSlug(slugify(e.target.value)) }}
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground font-mono focus:outline-none"
                />
              </div>
              {slugChanged && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5">
                  <AlertCircle className="size-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-400">
                    {t("slugWarning")}{" "}
                    <span className="opacity-70">{t("previousSlug")}<code>{tenant.slug}</code></span>
                  </p>
                </div>
              )}
            </div>

            {/* Plan */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">
                Plan
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PLAN_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPlan(p.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      plan === p.value ? p.color : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info owner (lecture seule) */}
            {tenant.owner_email && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1">{t("ownerLabel")}</p>
                <p className="text-xs text-foreground">{tenant.owner_email}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t("ownerChangeNote")}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                <AlertCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-400">{success}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              {t("close")}
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim() || !slug}
              className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
