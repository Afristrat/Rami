import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { signOutAction } from "@/lib/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Layers, LogOut, Sparkles, BarChart3, Calendar, Settings } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard",
}

const COMING_SOON_MODULES = [
  {
    icon: Sparkles,
    label: "Workflow créatif",
    description: "Générez du contenu social media en 7 étapes guidées.",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    description: "Suivez les performances de vos posts en temps réel.",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Calendar,
    label: "Calendrier",
    description: "Planifiez et schedulez vos publications.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Settings,
    label: "Brand DNA",
    description: "Configurez l'identité visuelle de votre marque.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "utilisateur"

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">RAMI</span>
            <span className="hidden text-[11px] uppercase tracking-widest text-white/20 sm:block">
              Agency OS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/40 sm:block">
              {user?.email}
            </span>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white/70"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Déconnexion</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Bienvenue */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour, {fullName} 👋
          </h1>
          <p className="mt-2 text-white/40">
            Bienvenue sur RAMI — votre Agency OS est en cours de déploiement.
          </p>
        </div>

        {/* Banner "En construction" */}
        <div className="mb-10 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-blue-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-violet-500/20 p-3">
              <Sparkles className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">
                🚀 Marathon 10 jours — Jour 1 terminé
              </h2>
              <p className="mt-1 text-sm text-white/50">
                L&apos;authentification est opérationnelle. Les modules suivants
                (Brand DNA, Workflow créatif, Publishing) arrivent dans les
                prochains jours.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Auth ✅", "Brand DNA 🔄", "Workflow 📋", "Publishing 📋", "Analytics 📋"].map(
                  (step) => (
                    <span
                      key={step}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/50"
                    >
                      {step}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modules grille */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COMING_SOON_MODULES.map((mod) => {
            const Icon = mod.icon
            return (
              <div
                key={mod.label}
                className={`relative rounded-xl border p-5 ${mod.bg} opacity-60 cursor-not-allowed`}
              >
                <div className="mb-3">
                  <Icon className={`h-5 w-5 ${mod.color}`} />
                </div>
                <h3 className="font-medium text-white">{mod.label}</h3>
                <p className="mt-1 text-xs text-white/40">{mod.description}</p>
                <div className="mt-3">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/30">
                    Bientôt disponible
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
