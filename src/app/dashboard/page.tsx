import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users, tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Sparkles, LayoutDashboard } from "lucide-react"

export const metadata: Metadata = {
  title: "Tableau de bord — RAMI",
  description: "Votre espace de travail RAMI.",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  })

  if (!dbUser?.onboarding_completed) redirect("/onboarding")

  const tenant = dbUser.tenant_id
    ? await db.query.tenants.findFirst({
        where: eq(tenants.id, dbUser.tenant_id),
      })
    : null

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">R</span>
            </div>
            <span className="text-lg font-bold text-foreground">RAMI</span>
            <span className="text-xs text-muted-foreground">by AI-MPower</span>
          </div>
          {tenant && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{tenant.name}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary uppercase">
                {tenant.plan}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Contenu */}
      <div className="mx-auto max-w-7xl px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10">
            <LayoutDashboard className="size-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenue, {user.user_metadata?.full_name ?? user.email} ! 🎉
            </h1>
            {tenant && (
              <p className="mt-2 text-muted-foreground">
                Votre espace <strong>{tenant.name}</strong> est prêt.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-5 py-3">
            <Sparkles className="size-5 text-primary" />
            <p className="text-sm text-primary font-medium">
              Le tableau de bord complet arrive prochainement — RAMI est en cours de construction.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
