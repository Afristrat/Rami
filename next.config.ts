import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

// ─── Headers de sécurité ──────────────────────────────────────────────────────
// Conforme CLAUDE.md Section 4.8 + 4.10

const CSP = [
  "default-src 'self'",
  // Scripts : Next.js + Stripe (billing)
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
  // Styles : Tailwind inline
  "style-src 'self' 'unsafe-inline'",
  // Images : self + Supabase Storage + Cloudflare R2 + avatars réseaux sociaux
  [
    "img-src 'self' data: blob:",
    "https://*.supabase.co",
    "https://*.r2.cloudflarestorage.com",
    // Fal.ai generated images CDN
    "https://fal.media",
    "https://*.fal.media",
    "https://storage.googleapis.com",
    // Twitter / X avatars
    "https://pbs.twimg.com",
    "https://abs.twimg.com",
    // LinkedIn avatars
    "https://media.licdn.com",
    "https://*.licdn.com",
    // Meta (Facebook + Instagram) avatars
    "https://*.fbcdn.net",
    "https://*.cdninstagram.com",
    "https://scontent.*.fbcdn.net",
    // Pinterest avatars
    "https://i.pinimg.com",
  ].join(" "),
  // Fonts
  "font-src 'self'",
  // Connexions API : Supabase + Stripe
  [
    "connect-src 'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.stripe.com",
    // PostHog analytics
    "https://app.posthog.com",
    "https://eu.posthog.com",
    // Sentry error reporting
    "https://*.sentry.io",
    "https://o*.ingest.sentry.io",
    // Image generation providers (API calls côté serveur — mais CSP couvre les fetch() client)
    "https://fal.run",
    "https://queue.fal.run",
    "https://api.replicate.com",
    "https://api.together.xyz",
  ].join(" "),
  // Frames : Stripe
  "frame-src https://js.stripe.com",
  // Objects
  "object-src 'none'",
  // Base URI
  "base-uri 'self'",
  // Form action
  "form-action 'self'",
  // Upgrade insecure requests en production
  ...(process.env.NODE_ENV === "production"
    ? ["upgrade-insecure-requests"]
    : []),
].join("; ")

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: CSP,
  },
]

const nextConfig: NextConfig = {
  // ─── Headers de sécurité sur toutes les routes ────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // CORS : API interne (dashboard uniquement)
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      // CORS ouvert pour l'API publique Agency+ (v1)
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ]
  },

  // ─── Images (optimisation Next.js pour les avatars plateformes) ───────────
  images: {
    remotePatterns: [
      // Supabase Storage
      { protocol: "https", hostname: "*.supabase.co" },
      // Cloudflare R2
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // MinIO Railway (assets privés)
      { protocol: "https", hostname: "*.railway.app" },
      // Twitter / X
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "abs.twimg.com" },
      // LinkedIn
      { protocol: "https", hostname: "media.licdn.com" },
      // Meta (Facebook + Instagram)
      { protocol: "https", hostname: "*.fbcdn.net" },
      { protocol: "https", hostname: "*.cdninstagram.com" },
      // Pinterest
      { protocol: "https", hostname: "i.pinimg.com" },
      // Fal.ai generated images
      { protocol: "https", hostname: "fal.media" },
      { protocol: "https", hostname: "*.fal.media" },
      // Replicate outputs
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "pbxt.replicate.delivery" },
    ],
  },

  // ─── Typescript strict ────────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
}

// ─── Sentry instrumentation (wrap en dernier) ─────────────────────────────────
export default withSentryConfig(nextConfig, {
  // Organisation et projet Sentry (optionnel — pour le source maps upload)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload des source maps uniquement si le token est présent
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Désactiver le tunnel Sentry (évite les CORS en dev)
  tunnelRoute: undefined,

  // Source maps en production uniquement
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },

  // Ne pas interférer avec le build en l'absence de config Sentry
  disableLogger: true,
  automaticVercelMonitors: false,
})
