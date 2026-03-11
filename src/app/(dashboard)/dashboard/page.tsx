import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users, tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { LayoutDashboard, Sparkles, CalendarDays, Wand2, BarChart3 } from "lucide-react"
import Link from "next/link"
import { WelcomeToast } from "@/components/dashboard/WelcomeToast"

export const metadata: Metadata = {
  title: "Tableau de bord — RAMI",
  description: "Votre espace de travail RAMI.",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware gère la redirection auth, mais on protège quand même
  if (!user) return null

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  })

  const tenant = dbUser?.tenant_id
    ? await db.query.tenants.findFirst({
        where: eq(tenants.id, dbUser.tenant_id),
      })
    : null

  const quickLinks = [
    { href: "/dashboard/create", icon: Wand2, label: "Créer du contenu", desc: "Démarrer le workflow 7 étapes" },
    { href: "/dashboard/calendar", icon: CalendarDays, label: "Calendrier", desc: "Planifier vos posts" },
    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics", desc: "Performances de vos contenus" },
  ]

  return (
    <div className="p-6">
      {/* Toast bienvenue post-onboarding */}
      <Suspense>
        <WelcomeToast tenantName={tenant?.name} />
      </Suspense>

      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <LayoutDashboard className="size-4" />
          <span className="text-sm">Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Bonjour{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {tenant ? (
            <>Espace <strong>{tenant.name}</strong> · Plan <span className="font-medium uppercase text-primary">{tenant.plan}</span></>
          ) : (
            "Bienvenue sur RAMI — votre Agency OS."
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Posts publiés", value: "0", sub: "ce mois" },
          { label: "Visuels générés", value: "0", sub: "ce mois" },
          { label: "Posts planifiés", value: "0", sub: "à venir" },
          { label: "Score Brand DNA", value: "—", sub: "à configurer" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-8">
        {quickLinks.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-4" />
            </div>
            <p className="font-semibold text-foreground">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>

      {/* CTA Brand DNA si non configuré */}
      {!tenant?.brand_dna && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
          <Sparkles className="mx-auto mb-3 size-8 text-primary/60" />
          <p className="text-sm font-medium text-foreground">
            Configurez votre{" "}
            <Link href="/dashboard/brand-dna" className="text-primary hover:underline font-semibold">
              Brand DNA
            </Link>{" "}
            pour générer du contenu ciblé et psychologiquement calculé.
          </p>
        </div>
      )}
    </div>
  )
}
