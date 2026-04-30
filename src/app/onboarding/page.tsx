import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Bienvenue sur RAMI — Configurez votre espace",
  description:
    "Créez votre espace de travail RAMI en 3 étapes simples.",
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Non authentifié -> login
  if (!user) redirect("/login")

  // Super admin -> jamais d'onboarding, accès direct au dashboard
  if (user.app_metadata?.role === "super_admin") redirect("/dashboard")

  // Déjà onboardé via user_metadata
  if (user.user_metadata?.onboarding_completed === true) redirect("/dashboard")

  // Vérification complémentaire via la table users (Supabase HTTP, pas Drizzle)
  const { data: existingUser } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (existingUser?.onboarding_completed) {
    redirect("/dashboard")
  }

  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* Decorative background — Stitch style */}
      <div className="fixed inset-0 rami-grid-pattern pointer-events-none" />
      <div className="rami-blob top-[-100px] left-[-100px] w-[500px] h-[500px] bg-rami-violet" />
      <div className="rami-blob bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-rami-blue" />
      <div className="rami-blob top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rami-violet/60" />

      {/* Stitch-style header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">RAMI</h1>
              <span className="text-xs text-muted-foreground">by AI-MPower</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <OnboardingWizard />
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6">
        <p className="text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} RAMI by AI-MPower Consulting. Tous droits réservés.
        </p>
      </footer>
    </main>
  )
}
