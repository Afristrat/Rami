/**
 * Sentry — Configuration côté client (navigateur)
 * Ce fichier est importé automatiquement par Next.js via instrumentation.
 */
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay sur les erreurs uniquement
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,

  // Désactiver en développement si pas de DSN configuré
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ignorer les erreurs réseau attendues
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error exception captured",
  ],
})
