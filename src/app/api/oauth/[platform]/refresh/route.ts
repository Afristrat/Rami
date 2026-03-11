import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getValidToken } from "@/lib/services/oauth/refresh"
import type { OAuthPlatform } from "@/lib/services/oauth/config"

const VALID_PLATFORMS: OAuthPlatform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "pinterest",
]

/**
 * POST /api/oauth/[platform]/refresh
 * Body: { connectionId: string }
 *
 * Rafraîchit le token OAuth si nécessaire (expires_at < now() + 5min).
 * Appelé par le publishing service avant chaque publication.
 * Conforme à SOP-002 — étape 3 (implémenter /refresh).
 *
 * Réponse : { accessToken: string, expiresAt: string | null }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

  if (!VALID_PLATFORMS.includes(platform as OAuthPlatform)) {
    return NextResponse.json({ error: "Plateforme invalide." }, { status: 400 })
  }

  // Auth requise
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  // Récupération du connectionId depuis le body
  let connectionId: string | undefined
  try {
    const body = await req.json()
    connectionId = body.connectionId as string | undefined
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 })
  }

  if (!connectionId) {
    // Si pas de connectionId, chercher la connexion active de la plateforme pour ce tenant
    const { data: conn, error: fetchError } = await supabase
      .from("oauth_connections")
      .select("id")
      .eq("tenant_id", user.id)
      .eq("platform", platform)
      .eq("is_active", true)
      .single()

    if (fetchError || !conn) {
      return NextResponse.json(
        { error: `Aucune connexion ${platform} active trouvée.` },
        { status: 404 }
      )
    }
    connectionId = conn.id as string
  }

  try {
    const result = await getValidToken(connectionId)
    return NextResponse.json(
      {
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
      },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh échoué."
    // Si le token est révoqué ou invalide → 401 pour signaler au publishing service
    const status = message.includes("Reconnectez") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
