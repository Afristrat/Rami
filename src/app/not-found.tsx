/**
 * Page 404 — Not Found
 * Affichée par Next.js quand aucune route ne correspond.
 */

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="space-y-2">
        <p className="text-6xl font-bold text-primary/30">404</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Page introuvable
        </h1>
        <p className="text-sm text-muted-foreground">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Tableau de bord
        </Link>
        <Link
          href="/"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Accueil
        </Link>
      </div>
    </div>
  )
}
