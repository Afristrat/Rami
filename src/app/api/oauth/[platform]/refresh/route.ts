import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getValidToken } from "@/lib/services/oauth/refresh"
import {
  PlatformParamSchema,
  RefreshBodySchema,
} from "@/lib/schemas/oauth.schema"

/**
 * POST /api/oauth/[platform]/refresh
 * Body: { connectionId?: string }
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

  // Validation Zod du paramètre platform
  const platformResult = PlatformParamSchema.safeParse(platform)
  if (!platformResult.success) {
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

  // Validation Zod du body JSON
  let connectionId: string | undefined
  try {
    const rawBody = await req.json()
    const bodyResult = RefreshBodySchema.safeParse(rawBody)
    if (!bodyResult.success) {
      return NextResponse.json(
        { error: "Body invalide.", details: bodyResult.error.issues },
        { status: 400 }
      )
    }
    connectionId = bodyResult.data.connectionId
  } catch {
    // Body vide ou non-JSON : connectionId reste undefined → lookup automatique
  }

  if (!connectionId) {
    // Lookup de la connexion active du tenant pour cette plateforme
    // (RLS isole par get_current_tenant_id()).
    const { data: conn, error: fetchError } = await supabase
      .from("oauth_connections")
      .select("id")
      .eq("platform", platformResult.data)
      .eq("is_active", true)
      .single()

    if (fetchError || !conn) {
      return NextResponse.json(
        { error: `Aucune connexion ${platformResult.data} active trouvée.` },
        { status: 404 }
      )
    }
    connectionId = conn.id as string
  }

  try {
    const result = await getValidToken(connectionId)
    return NextResponse.json(
      { accessToken: result.accessToken, expiresAt: result.expiresAt },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh échoué."
    const status = message.includes("Reconnectez") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
