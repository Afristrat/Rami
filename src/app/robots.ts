/**
 * RAMI — robots.txt dynamique
 * Bloque les crawlers sur toutes les routes dashboard/API.
 * Autorise uniquement les pages publiques (/, /pricing, /login, /register).
 */
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://rami.ai-mpower.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/login", "/register", "/reset-password"],
        disallow: [
          "/dashboard/",
          "/settings/",
          "/billing/",
          "/create/",
          "/onboarding/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
