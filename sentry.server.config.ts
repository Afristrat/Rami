/**
 * Sentry — Configuration côté serveur (Node.js / Edge)
 * Ce fichier est importé automatiquement par Next.js via instrumentation.
 */
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring (réduit en production pour limiter les coûts)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Désactiver si pas de DSN configuré
  enabled: !!process.env.SENTRY_DSN,
})
