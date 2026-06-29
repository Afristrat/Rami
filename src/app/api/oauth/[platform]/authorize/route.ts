import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOAuthConfig } from "@/lib/services/oauth/config"
import { generateOAuthState } from "@/lib/services/oauth/state"
import { PlatformParamSchema } from "@/lib/schemas/oauth.schema"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

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
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL))
  }

  const validPlatform = platformResult.data
  const config = getOAuthConfig(validPlatform)
  const clientId = process.env[config.clientIdEnv]

  if (!clientId) {
    return NextResponse.json(
      { error: `Clé ${config.clientIdEnv} manquante. Configurez les variables d'environnement.` },
      { status: 503 }
    )
  }

  const state = generateOAuthState(validPlatform, user.id)
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${validPlatform}/callback`

  const url = new URL(config.authorizeUrl)
  // TikTok porte l'identifiant client sous `client_key` (pas `client_id`).
  url.searchParams.set(config.clientIdParam ?? "client_id", clientId)
  url.searchParams.set("redirect_uri", callbackUrl)
  url.searchParams.set("scope", config.scopes.join(config.scopeSeparator ?? " "))
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")

  // Paramètres spécifiques au provider (ex. Google : access_type=offline, prompt=consent).
  if (config.authorizeExtraParams) {
    for (const [key, value] of Object.entries(config.authorizeExtraParams)) {
      url.searchParams.set(key, value)
    }
  }

  // Twitter PKCE spécifique
  if (validPlatform === "twitter") {
    url.searchParams.set("code_challenge_method", "plain")
    url.searchParams.set("code_challenge", state.slice(0, 43))
  }

  return NextResponse.redirect(url.toString())
}
