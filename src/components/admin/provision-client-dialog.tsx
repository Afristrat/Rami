"use client"

import { useState, useTransition, useId } from "react"
import { useTranslations } from "next-intl"
import { UserPlus, X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { provisionClientAction } from "@/lib/actions/admin.actions"
import { slugify } from "@/lib/utils/slugify"

const PLAN_OPTIONS = [
  { value: "free",         label: "Free — $0/mois",        color: "text-muted-foreground" },
  { value: "solo",         label: "Solo — $59/mois",        color: "text-blue-400" },
  { value: "pro",          label: "Pro — $149/mois",        color: "text-violet-400" },
  { value: "agency",       label: "Agency — $399/mois",     color: "text-orange-400" },
  { value: "agency_plus",  label: "Agency+ — $699/mois",    color: "text-amber-400" },
  { value: "enterprise",   label: "Enterprise — sur devis",  color: "text-rose-400" },
] as const

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (tenantId: string, email: string, tenantName: string, plan: string) => void
}

export function ProvisionClientDialog({ open, onClose, onCreated }: Props) {
  const formId = useId()
  const [isPending, startTransition] = useTransition()

  const t = useTranslations("admin")
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [tenantName, setTenantName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManual, setSlugManual] = useState(false)
  const [plan, setPlan] = useState<string>("free")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ tenantId: string } | null>(null)

  function handleTenantNameChange(value: string) {
    setTenantName(value)
    if (!slugManual) {
      setSlug(slugify(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugManual(true)
    setSlug(slugify(value))
  }

  function resetSlug() {
    setSlugManual(false)
    setSlug(slugify(tenantName))
  }

  function handleClose() {
    if (isPending) return
    setEmail("")
    setDisplayName("")
    setTenantName("")
    setSlug("")
    setSlugManual(false)
    setPlan("free")
    setError(null)
    setSuccess(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await provisionClientAction(email, displayName, tenantName, slug, plan)

      if ("error" in result) {
        setError(result.error)
        return
      }

      setSuccess({ tenantId: result.tenantId })
      onCreated(result.tenantId, email, tenantName, plan)
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
              <UserPlus className="size-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("provisionAccount")}</h2>
              <p className="text-xs text-muted-foreground">{t("provisionAccountDescription")}</p>
            </div>
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

        {/* Succès */}
        {success ? (
          <div className="px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="size-6 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">{t("accountProvisioned")}</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {t("invitationSent")} <span className="text-foreground font-medium">{email}</span>.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              {t("clientWillSetPassword")}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <form id={formId} onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-5">

              {/* Bloc — Compte utilisateur */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("userAccount")}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      {t("emailLabel")} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@agence.com"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t("invitationLinkNote")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      {t("fullName")}
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Sarah Dupont"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-border" />

              {/* Bloc — Espace de travail */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("workspace")}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      {t("agencyBrandName")} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tenantName}
                      onChange={(e) => handleTenantNameChange(e.target.value)}
                      placeholder="Agence Bloom"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Slug <span className="text-red-400">*</span>
                      </label>
                      {slugManual && (
                        <button
                          type="button"
                          onClick={resetSlug}
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
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="agence-bloom"
                        className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t("slugConstraints")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      {t("planLabel")} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      {PLAN_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value} className="bg-card text-foreground">
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t("planModifiable")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                  <AlertCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <p className="text-[11px] text-muted-foreground">
                {t("invitationAutomatic")}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isPending || !email || !tenantName || !slug}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("provisioning")}
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5" />
                      {t("provision")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
