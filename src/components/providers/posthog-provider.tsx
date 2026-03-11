"use client"

/**
 * RAMI — PostHog Analytics Provider
 * Wraps l'app avec PostHog pour le tracking d'usage (SaaS analytics).
 * Désactivé si NEXT_PUBLIC_POSTHOG_KEY n'est pas configuré.
 *
 * Events trackés définis dans CLAUDE.md §6.2 :
 * tenant_signup, brand_dna_completed, workflow_started, visual_generated,
 * post_published, feature_upgrade_viewed, subscription_upgraded
 */

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"

if (typeof window !== "undefined" && POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,   // Géré manuellement ci-dessous
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    // Respecter le DNT header
    respect_dnt: true,
    // Désactiver la capture automatique en dev pour éviter le bruit
    autocapture: process.env.NODE_ENV === "production",
  })
}

// useSearchParams() DOIT être dans un Suspense boundary (Next.js App Router)
function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY) return
    if (pathname.startsWith("/api/")) return

    posthog.capture("$pageview", {
      $current_url: window.location.href,
    })
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      {/* Suspense requis : useSearchParams() dans PageviewTracker */}
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  )
}
