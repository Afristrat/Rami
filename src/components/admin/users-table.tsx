"use client"

import { useState, useTransition } from "react"
import { Search, ChevronLeft, ChevronRight, Loader2, ShieldAlert, UserPlus, Pencil } from "lucide-react"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"
import type { AdminUser } from "@/lib/actions/admin.actions"
import { AddUserDialog } from "./add-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

type Props = {
  initialUsers: AdminUser[]
  initialTotal: number
}

const PAGE_SIZE = 20

export function UsersTable({ initialUsers, initialTotal }: Props) {
  const t = useTranslations("admin")
  const intlLocale = useIntlLocale()
  const [users, setUsers] = useState(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function loadUsers(newPage: number, newSearch: string) {
    startTransition(async () => {
      try {
        const { getAdminUsers } = await import("@/lib/actions/admin.actions")
        const result = await getAdminUsers(newPage, newSearch)
        if ("data" in result) {
          setUsers(result.data.users)
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
    loadUsers(1, value)
  }

  function handlePage(newPage: number) {
    setPage(newPage)
    loadUsers(newPage, search)
  }

  function handleUserCreated(userId: string, email: string, tenantName: string) {
    const newUser: AdminUser = {
      id: userId,
      email,
      display_name: null,
      role: "user",
      tenant_name: tenantName,
      created_at: new Date().toISOString(),
    }
    setUsers((prev) => [newUser, ...prev])
    setTotal((prev) => prev + 1)
  }

  return (
    <div>
      {/* Barre de recherche + bouton */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder={t("searchByEmailOrName")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <span className="text-sm text-muted-foreground flex-1">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin text-violet-400" />
          ) : (
            `${total} ${t("users").toLowerCase()}`
          )}
        </span>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-medium text-white transition-colors"
        >
          <UserPlus className="size-3.5" />
          {t("addUser")}
        </button>
      </div>

      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleUserCreated}
      />

      <EditUserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onUpdated={(userId, fields) => {
          setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...fields } : u))
          setEditUser(null)
        }}
      />

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {users.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("noUserFound")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("columnEmail")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">{t("columnDisplayName")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">{t("columnTenant")}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("columnRole")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">{t("columnRegistered")}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("columnActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const isSuperAdmin = u.role === "super_admin"

                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground truncate max-w-[200px]">{u.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-muted-foreground truncate max-w-[140px]">
                        {u.display_name ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {u.tenant_name ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
                          <ShieldAlert className="size-2.5" />
                          super_admin
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">user</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{formatDate(u.created_at, intlLocale)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditUser(u)}
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
