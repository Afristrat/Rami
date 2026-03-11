import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata: Metadata = {
  title: "Connexion — RAMI",
  description: "Connectez-vous à votre espace RAMI.",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary shadow-md">
            <span className="text-xl font-bold text-primary-foreground">R</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Connexion à RAMI</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bienvenue de retour dans votre Agency OS
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>

        {/* Lien inscription */}
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Créer un compte gratuitement
          </Link>
        </p>
      </div>
    </main>
  )
}
