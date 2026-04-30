/**
 * PostHog — Server-side event capture.
 * Envoie les événements métier critiques via l'API REST de PostHog
 * depuis les Server Actions (pas de SDK PostHog Node requis).
 *
 * Events conformes CLAUDE.md §6.2 :
 *   tenant_signup, brand_dna_completed, visual_generated,
 *   post_published, subscription_upgraded
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"

interface CaptureParams {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}

/**
 * Envoie un événement PostHog côté serveur via l'API REST /capture.
 * Ne bloque pas — fire-and-forget. Si PostHog n'est pas configuré, no-op silencieux.
 */
export function captureServerEvent({ distinctId, event, properties }: CaptureParams): void {
  if (!POSTHOG_KEY) return

  const body = JSON.stringify({
    api_key: POSTHOG_KEY,
    event,
    distinct_id: distinctId,
    properties: {
      ...properties,
      $lib: "rami-server",
    },
    timestamp: new Date().toISOString(),
  })

  // Fire-and-forget — ne pas attendre la réponse
  fetch(`${POSTHOG_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {
    // Silencieux — PostHog indisponible ne doit pas bloquer l'application
  })
}
