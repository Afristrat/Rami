import { Users } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getAdminUsers } from "@/lib/actions/admin.actions"
import { UsersTable } from "@/components/admin/users-table"

export const metadata = {
  title: "Utilisateurs — Admin RAMI",
  robots: "noindex, nofollow",
}

export default async function AdminUsersPage() {
  const result = await getAdminUsers(1, "")
  const initialUsers = "data" in result ? result.data.users : []
  const initialTotal = "data" in result ? result.data.total : 0
  const fetchError = "error" in result ? result.error : null
  const t = await getTranslations("admin")

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Users className="size-4" />
          <span className="text-sm font-medium">{t("users")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("usersManagement")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("usersDescription")}
        </p>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{t("errorPrefix")}{fetchError}</p>
        </div>
      )}

      <UsersTable initialUsers={initialUsers} initialTotal={initialTotal} />
    </div>
  )
}
