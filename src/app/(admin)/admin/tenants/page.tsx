import { Building2 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getAdminTenants } from "@/lib/actions/admin.actions"
import { TenantsTable } from "@/components/admin/tenants-table"

export const metadata = {
  title: "Tenants — Admin RAMI",
  robots: "noindex, nofollow",
}

export default async function AdminTenantsPage() {
  const result = await getAdminTenants(1, "")
  const initialTenants = "data" in result ? result.data.tenants : []
  const initialTotal = "data" in result ? result.data.total : 0
  const fetchError = "error" in result ? result.error : null
  const t = await getTranslations("admin")

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Building2 className="size-4" />
          <span className="text-sm font-medium">{t("tenants")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("tenantsManagement")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("tenantsDescription")}
        </p>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{t("errorPrefix")}{fetchError}</p>
        </div>
      )}

      <TenantsTable initialTenants={initialTenants} initialTotal={initialTotal} />
    </div>
  )
}
