/**
 * Sentry — Configuration Edge Runtime (Vercel Edge Functions, middleware)
 * Ce fichier est importé dynamiquement par instrumentation.ts pour NEXT_RUNTIME === "edge".
 */
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Échantillonnage réduit en Edge (coûts + latence)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Désactiver si pas de DSN configuré
  enabled: !!process.env.SENTRY_DSN,
})
