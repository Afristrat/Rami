import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

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

  // Vérification auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Vérification rôle super_admin dans la table profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (profileError || profile?.role !== "super_admin") {
    // Redirection silencieuse — ne pas révéler l'existence de la page admin
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Badge admin */}
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                <span className="size-1.5 rounded-full bg-red-400" />
                ADMIN
              </span>
              <span className="text-sm font-semibold text-foreground">
                RAMI — Console d&apos;administration
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
              <a
                href="/dashboard"
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                ← Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Admin nav */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex gap-1 py-1">
            {[
              { href: "/admin/prompts", label: "🤖 Prompts IA" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
