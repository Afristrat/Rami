/**
 * RAMI — Health check endpoint
 * Utilisé par Vercel, Railway, et les outils de monitoring externes.
 * Vérifie : connectivité Supabase + statut global.
 *
 * GET /api/health → 200 OK | 503 Service Unavailable
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface HealthStatus {
  status: "ok" | "degraded" | "down"
  version: string
  timestamp: string
  checks: {
    supabase: "ok" | "error"
    env: "ok" | "missing"
  }
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString()
  const version = process.env.npm_package_version ?? "0.1.0"

  const checks: HealthStatus["checks"] = {
    supabase: "ok",
    env: "ok",
  }

  // ── Vérification variables d'environnement critiques ──────────────────────
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]

  const missingVars = requiredEnvVars.filter((v) => !process.env[v])
  if (missingVars.length > 0) {
    checks.env = "missing"
  }

  // ── Ping Supabase (requête légère) ────────────────────────────────────────
  if (checks.env === "ok") {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase
        .from("tenants")
        .select("id")
        .limit(1)
        .maybeSingle()

      // RLS peut retourner null sans erreur — c'est OK
      if (error && error.code !== "PGRST116") {
        checks.supabase = "error"
      }
    } catch {
      checks.supabase = "error"
    }
  }

  // ── Calcul du statut global ───────────────────────────────────────────────
  const allOk = Object.values(checks).every((v) => v === "ok")
  const anyDown = checks.supabase === "error" && checks.env === "missing"

  const status: HealthStatus["status"] = allOk
    ? "ok"
    : anyDown
      ? "down"
      : "degraded"

  const httpStatus = status === "ok" ? 200 : status === "degraded" ? 200 : 503

  return NextResponse.json({ status, version, timestamp, checks }, { status: httpStatus })
}
