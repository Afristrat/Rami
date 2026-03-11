"use client"

/**
 * Boundary d'erreur global Next.js App Router.
 * Capte les erreurs runtime non gérées dans l'arbre de composants.
 * Conforme CLAUDE.md §6.1 — observabilité et récupération gracieuse.
 */

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import * as Sentry from "@sentry/nextjs"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Rapporter à Sentry en production
    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Une erreur est survenue
        </h1>
        <p className="text-sm text-muted-foreground">
          Nous avons été notifiés et résolvons le problème.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/60">
            Référence : {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Réessayer
        </Button>
        <Button
          onClick={() => (window.location.href = "/dashboard")}
          variant="outline"
        >
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  )
}
