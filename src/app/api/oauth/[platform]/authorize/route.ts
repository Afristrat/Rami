import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getOAuthConfig,
  type OAuthPlatform,
} from "@/lib/services/oauth/config"
import { generateOAuthState } from "@/lib/services/oauth/state"

const VALID_PLATFORMS: OAuthPlatform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "pinterest",
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params

  // Validation de la plateforme
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
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL))
  }

  const config = getOAuthConfig(platform as OAuthPlatform)
  const clientId = process.env[config.clientIdEnv]

  if (!clientId) {
    return NextResponse.json(
      { error: `Clé ${config.clientIdEnv} manquante. Configurez les variables d'environnement.` },
      { status: 503 }
    )
  }

  const state = generateOAuthState(platform, user.id)
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${platform}/callback`

  const url = new URL(config.authorizeUrl)
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", callbackUrl)
  url.searchParams.set("scope", config.scopes.join(" "))
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")

  // Twitter PKCE spécifique
  if (platform === "twitter") {
    url.searchParams.set("code_challenge_method", "plain")
    url.searchParams.set("code_challenge", state.slice(0, 43))
  }

  return NextResponse.redirect(url.toString())
}
