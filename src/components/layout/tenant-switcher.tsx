"use client"

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { getUserTenantsAction, type UserTenant } from "@/lib/actions/tenants.actions"

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
  const t = useTranslations("tenants")

  useEffect(() => {
    getUserTenantsAction().then((result) => {
      if ("tenants" in result) {
        setTenants(result.tenants)
        setCurrentTenantId(result.currentTenantId)
      }
      setLoading(false)
    })
  }, [])

  const currentTenant = tenants.find((ten) => ten.id === currentTenantId) ?? tenants[0] ?? null

  // État de chargement
  if (loading) {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm font-medium text-sidebar-foreground animate-pulse">
        <div className="size-6 rounded-md bg-muted" />
        <div className="flex-1 h-3 rounded bg-muted" />
      </div>
    )
  }

  // Aucun tenant trouvé — état vide honnête
  if (!currentTenant) {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm font-medium text-muted-foreground">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs">
          —
        </div>
        <span className="flex-1 truncate text-left">{t("noTenantsYet")}</span>
      </div>
    )
  }

  // Tenant unique — pas besoin de switcher (UX épuré)
  if (tenants.length === 1) {
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

  // Tenants multiples — afficher avec le courant actif, autres désactivés + tooltip natif
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            {currentTenant.name.charAt(0)}
          </div>
          <span className="flex-1 truncate text-left">{currentTenant.name}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-foreground/40" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-56 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/10 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={6}
          align="start"
        >
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t("label")}
          </div>

          {tenants.map((tenant) => {
            const isActive = tenant.id === currentTenantId

            if (isActive) {
              return (
                <DropdownMenu.Item
                  key={tenant.id}
                  className="flex cursor-default select-none items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none bg-accent text-accent-foreground"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {tenant.name.charAt(0)}
                  </div>
                  <span className="flex-1 truncate">{tenant.name}</span>
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", PLAN_COLORS[tenant.plan])}>
                    {tenant.plan}
                  </span>
                  <Check className="size-3.5 shrink-0 text-primary" />
                </DropdownMenu.Item>
              )
            }

            // Tenant non-actif : désactivé avec tooltip natif indiquant que le switch
            // multi-tenant en cours de session n'est pas encore supporté.
            return (
              <DropdownMenu.Item
                key={tenant.id}
                disabled
                title={t("switchUnavailable")}
                className="flex cursor-not-allowed select-none items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none opacity-50"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                  {tenant.name.charAt(0)}
                </div>
                <span className="flex-1 truncate">{tenant.name}</span>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", PLAN_COLORS[tenant.plan])}>
                  {tenant.plan}
                </span>
              </DropdownMenu.Item>
            )
          })}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            <Plus className="size-4" />
            <span>{t("addTenant")}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
