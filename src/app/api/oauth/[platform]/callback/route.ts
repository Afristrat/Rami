import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getOAuthConfig,
  type OAuthPlatform,
} from "@/lib/services/oauth/config"
import {
  parseOAuthState,
  encryptToken,
} from "@/lib/services/oauth/state"

const VALID_PLATFORMS: OAuthPlatform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "pinterest",
]

const REDIRECT_SUCCESS = "/dashboard/settings/connections?success=connected"
const REDIRECT_ERROR = "/dashboard/settings/connections?error="

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const oauthError = searchParams.get("error")

  // Validation plateforme
  if (!VALID_PLATFORMS.includes(platform as OAuthPlatform)) {
    return NextResponse.redirect(
      `${REDIRECT_ERROR}invalid_platform`
    )
  }

  // Erreur renvoyée par la plateforme
  if (oauthError || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}${oauthError ?? "missing_params"}`
    )
  }

  // Validation du state CSRF
  const stateData = parseOAuthState(state)
  if (!stateData || stateData.platform !== platform) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}invalid_state`
    )
  }

  // Auth courante
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user || user.id !== stateData.userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}auth_mismatch`
    )
  }

  const config = getOAuthConfig(platform as OAuthPlatform)
  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${platform}/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}missing_credentials`
    )
  }

  // Échange code → token
  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}token_exchange_failed`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenData: any = await tokenRes.json()
  const accessToken: string = tokenData.access_token
  const refreshToken: string | undefined = tokenData.refresh_token
  const expiresIn: number | undefined = tokenData.expires_in

  // Chiffrement AES-256 avant stockage
  const encryptedAccess = encryptToken(accessToken)
  const encryptedRefresh = refreshToken ? encryptToken(refreshToken) : null
  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null

  // Récupération infos compte (simplifié — sera enrichi par plateforme)
  const accountName = user.email ?? "Compte connecté"

  // Upsert connexion OAuth en DB
  const { error: dbError } = await supabase.from("oauth_connections").upsert(
    {
      tenant_id: user.id, // TODO: remplacer par vrai tenant_id lors de la migration multi-tenant
      platform,
      account_id: user.id,
      account_name: accountName,
      access_token_encrypted: encryptedAccess,
      refresh_token_encrypted: encryptedRefresh,
      expires_at: expiresAt,
      is_active: true,
      scope: config.scopes,
    },
    {
      onConflict: "tenant_id,platform",
    }
  )

  if (dbError) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}db_error`
    )
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_SUCCESS}`
  )
}
