import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin/admin-nav"

/**
 * Layout admin — accessible uniquement aux super_admin.
 * Vérifie le rôle via la table `profiles` (app_role enum).
 * Tout accès non autorisé est redirigé vers /dashboard.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const t = await getTranslations("admin")

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Double vérification : app_metadata (Auth) OU profiles (DB)
  // app_metadata est défini via Admin API → source la plus fiable
  const isSuperAdminViaJwt = user.app_metadata?.role === 'super_admin'

  if (!isSuperAdminViaJwt) {
    // Fallback 1 : vérifier la table profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("global_role")
      .eq("id", user.id)
      .single()

    if (profile?.global_role !== "super_admin") {
      // Fallback 2 : vérifier users.role (table Drizzle)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                <span className="size-1.5 rounded-full bg-red-400" />
                ADMIN
              </span>
              <span className="text-sm font-semibold text-foreground">
                {t("consoleTitle")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <a
                href="/dashboard"
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                &larr; {t("backToDashboard")}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Admin nav — client component for active state */}
      <AdminNav />

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
