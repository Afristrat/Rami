"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { getUserTenantsAction, type UserTenant } from "@/lib/actions/tenants.actions"
import { createBrandAction, switchBrandAction, canCreateBrandsAction } from "@/lib/actions/brand-management.actions"

const PLAN_COLORS: Record<UserTenant["plan"], string> = {
  free:         "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  solo:         "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  pro:          "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  agency:       "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  agency_plus:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  enterprise:   "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
}

export function TenantSwitcher() {
  const [tenants, setTenants] = useState<UserTenant[]>([])
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [canCreate, setCanCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations("tenants")

  useEffect(() => {
    getUserTenantsAction().then((result) => {
      if ("tenants" in result) {
        setTenants(result.tenants)
        setCurrentTenantId(result.currentTenantId)
      }
      setLoading(false)
    })
    canCreateBrandsAction().then(setCanCreate)
  }, [])

  const currentTenant = tenants.find((ten) => ten.id === currentTenantId) ?? tenants[0] ?? null

  async function handleSwitch(id: string) {
    if (id === currentTenantId || busy) return
    setBusy(true)
    setError(null)
    const res = await switchBrandAction(id)
    if ("success" in res) {
      window.location.reload()
    } else {
      setError(res.error)
      setBusy(false)
    }
  }

  async function handleCreate() {
    const name = newName.trim()
    if (name.length < 2 || busy) return
    setBusy(true)
    setError(null)
    const res = await createBrandAction({ name })
    if ("id" in res) {
      // Bascule directement sur la nouvelle marque.
      await switchBrandAction(res.id)
      window.location.reload()
    } else {
      setError(res.error)
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm font-medium text-sidebar-foreground animate-pulse">
        <div className="size-6 rounded-md bg-muted" />
        <div className="flex-1 h-3 rounded bg-muted" />
      </div>
    )
  }

  if (!currentTenant) {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm font-medium text-muted-foreground">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs">—</div>
        <span className="flex-1 truncate text-left">{t("noTenantsYet")}</span>
      </div>
    )
  }

  // Une seule marque ET pas le droit d'en créer → affichage simple (pas de menu).
  if (tenants.length === 1 && !canCreate) {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm font-medium text-sidebar-foreground">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
          {currentTenant.name.charAt(0)}
        </div>
        <span className="flex-1 truncate text-left">{currentTenant.name}</span>
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", PLAN_COLORS[currentTenant.plan])}>
          {currentTenant.plan}
        </span>
      </div>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={busy}
          className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:opacity-60"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            {currentTenant.name.charAt(0)}
          </div>
          <span className="flex-1 truncate text-left">{currentTenant.name}</span>
          {busy ? <Loader2 className="size-3.5 shrink-0 animate-spin" /> : <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/40" />}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-64 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/10 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={6}
          align="start"
        >
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t("label")}
          </div>

          {tenants.map((tenant) => {
            const isActive = tenant.id === currentTenantId
            return (
              <DropdownMenu.Item
                key={tenant.id}
                onSelect={(e) => {
                  e.preventDefault()
                  if (!isActive) handleSwitch(tenant.id)
                }}
                className={cn(
                  "flex select-none items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none",
                  isActive
                    ? "cursor-default bg-accent text-accent-foreground"
                    : "cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                )}
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                  {tenant.name.charAt(0)}
                </div>
                <span className="flex-1 truncate">{tenant.name}</span>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", PLAN_COLORS[tenant.plan])}>
                  {tenant.plan}
                </span>
                {isActive && <Check className="size-3.5 shrink-0 text-primary" />}
              </DropdownMenu.Item>
            )
          })}

          {canCreate && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              {creating ? (
                <div className="p-1.5" onKeyDown={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate()
                      if (e.key === "Escape") setCreating(false)
                    }}
                    placeholder="Nom de la nouvelle marque"
                    className="mb-1.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={busy || newName.trim().length < 2}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                      Créer
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCreating(false); setNewName(""); setError(null) }}
                      className="rounded-lg border border-border px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <DropdownMenu.Item
                  onSelect={(e) => { e.preventDefault(); setCreating(true) }}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <Plus className="size-4" />
                  <span>{t("addTenant")}</span>
                </DropdownMenu.Item>
              )}
            </>
          )}

          {error && <div className="px-2 py-1 text-[11px] text-destructive">{error}</div>}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
