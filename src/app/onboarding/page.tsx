import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

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

  // Non authentifié → login
  if (!user) redirect("/login")

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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {/* Logo RAMI */}
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">R</span>
            </div>
            <span className="text-lg font-bold text-foreground">RAMI</span>
            <span className="text-xs text-muted-foreground">by AI-MPower</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Connecté en tant que{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Titre de bienvenue */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Bienvenue sur RAMI 👋
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-lg mx-auto">
            Configurez votre espace de travail en 3 minutes pour commencer à créer
            du contenu social media qui touche juste.
          </p>
        </div>

        <OnboardingWizard />
      </div>
    </main>
  )
}
