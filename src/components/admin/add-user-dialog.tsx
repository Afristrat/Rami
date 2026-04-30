"use client"

import { useState, useTransition, useEffect } from "react"
import { useTranslations } from "next-intl"
import { UserPlus, X, Loader2, CheckCircle2, AlertCircle, Search, Building2 } from "lucide-react"
import { addUserToTenantAction, getTenantsListAction } from "@/lib/actions/admin.actions"

type Tenant = { id: string; name: string; slug: string }

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (userId: string, email: string, tenantName: string) => void
}

const ROLE_OPTIONS = [
  {
    value: "admin",
    labelKey: "roleAdmin" as const,
    descriptionKey: "roleAdminDescription" as const,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  {
    value: "editor",
    labelKey: "roleEditor" as const,
    descriptionKey: "roleEditorDescription" as const,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    value: "viewer",
    labelKey: "roleViewer" as const,
    descriptionKey: "roleViewerDescription" as const,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
] as const

export function AddUserDialog({ open, onClose, onCreated }: Props) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("admin")
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantSearch, setTenantSearch] = useState("")

  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("viewer")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ userId: string } | null>(null)

  // Charger les tenants au premier affichage
  useEffect(() => {
    if (!open || tenants.length > 0) return
    queueMicrotask(() => setTenantsLoading(true))
    getTenantsListAction()
      .then((result) => {
        if ("data" in result) setTenants(result.data)
      })
      .finally(() => setTenantsLoading(false))
  }, [open, tenants.length])

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.slug.toLowerCase().includes(tenantSearch.toLowerCase())
  )

  function handleClose() {
    if (isPending) return
    setEmail("")
    setDisplayName("")
    setSelectedTenant(null)
    setRole("viewer")
    setError(null)
    setSuccess(null)
    setTenantSearch("")
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTenant) {
      setError(t("selectTenant"))
      return
    }
    setError(null)

    startTransition(async () => {
      const result = await addUserToTenantAction(email, displayName, selectedTenant.id, role)

      if ("error" in result) {
        setError(result.error)
        return
      }

      setSuccess({ userId: result.userId })
      onCreated(result.userId, email, selectedTenant.name)
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
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
              <UserPlus className="size-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("addUserTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("addUserDescription")}</p>
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
            <h3 className="text-base font-semibold text-foreground mb-1">{t("userAdded")}</h3>
            <p className="text-sm text-muted-foreground mb-1">
              {t("invitationEmailSent")}{" "}
              <span className="text-foreground font-medium">{email}</span>.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              {t("attachedTo")} <span className="text-foreground">{selectedTenant?.name}</span> {t("withRole")}
              {t("withRole")} <span className="text-foreground">{role}</span>.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              {t("close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-5">

              {/* Compte utilisateur */}
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
                      placeholder="utilisateur@client.com"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t("accountExists")}
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
                      placeholder="Prénom Nom"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-border" />

              {/* Sélection du tenant */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("assignToTenant")} <span className="text-red-400">*</span>
                </p>

                {/* Search tenants */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={tenantSearch}
                    onChange={(e) => setTenantSearch(e.target.value)}
                    placeholder={t("searchTenant")}
                    className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Liste tenants */}
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {tenantsLoading ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span className="text-xs">{t("loading")}</span>
                    </div>
                  ) : filteredTenants.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      {t("noTenantFoundShort")}
                    </div>
                  ) : (
                    filteredTenants.map((t) => {
                      const isSelected = selectedTenant?.id === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTenant(t)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            isSelected
                              ? "bg-blue-500/10 text-blue-400"
                              : "text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Building2 className={`size-3.5 shrink-0 ${isSelected ? "text-blue-400" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{t.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{t.slug}</p>
                          </div>
                          {isSelected && (
                            <div className="size-2 rounded-full bg-blue-400 shrink-0" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
                {selectedTenant && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {t("selected")}<span className="text-foreground font-medium">{selectedTenant.name}</span>
                  </p>
                )}
              </div>

              {/* Séparateur */}
              <div className="border-t border-border" />

              {/* Rôle */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("roleInTenant")} <span className="text-red-400">*</span>
                </p>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                        role === r.value
                          ? r.color
                          : "border-border text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={() => setRole(r.value)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium">{t(r.labelKey)}</p>
                        <p className="text-[11px] opacity-70">{t(r.descriptionKey)}</p>
                      </div>
                      {role === r.value && (
                        <div className="size-2 rounded-full bg-current shrink-0" />
                      )}
                    </label>
                  ))}
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
                {t("invitationByEmail")}
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
                  disabled={isPending || !email || !selectedTenant}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {t("adding")}
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5" />
                      Ajouter
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
