"use client"

/**
 * Boundary d'erreur du layout dashboard.
 * Capte les erreurs dans les routes authentifiées sans déconnecter l'utilisateur.
 */

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import * as Sentry from "@sentry/nextjs"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(error)
    }
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Une erreur est survenue dans cette section
        </h2>
        <p className="text-sm text-muted-foreground">
          Vos données sont en sécurité. Vous pouvez réessayer ou naviguer ailleurs.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground/60">
            Référence : {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={reset} variant="default" size="sm">
          Réessayer
        </Button>
        <Button
          onClick={() => (window.location.href = "/dashboard")}
          variant="outline"
          size="sm"
        >
          Tableau de bord
        </Button>
      </div>
    </div>
  )
}
