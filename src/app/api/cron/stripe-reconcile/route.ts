/**
 * RAMI — Cron de réconciliation Stripe
 * Déclenché par Vercel Cron Jobs (vercel.json) tous les jours à 2h UTC.
 *
 * Appelle la Supabase Edge Function "stripe-reconcile" qui synchronise
 * les abonnements Stripe avec la table tenants (plan, status, quota).
 *
 * Sécurisé par STRIPE_RECONCILE_CRON_SECRET.
 */

import { NextResponse } from "next/server"

export const runtime = "edge"
export const maxDuration = 30

export async function GET(request: Request): Promise<NextResponse> {
  // ── Vérification du secret Vercel Cron ────────────────────────────────────
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.STRIPE_RECONCILE_CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 })
  }

  try {
    // ── Appel de la Edge Function Supabase ────────────────────────────────────
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-reconcile`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ triggered_by: "vercel-cron", timestamp: new Date().toISOString() }),
    })

    if (!response.ok) {
      const body = await response.text()
      return NextResponse.json(
        { error: "Edge Function failed", details: body },
        { status: 502 }
      )
    }

    const result = await response.json() as Record<string, unknown>

    return NextResponse.json({
      ok: true,
      message: "Réconciliation Stripe déclenchée",
      result,
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Cron failed", details: String(err) },
      { status: 500 }
    )
  }
}
