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
import { fetchAccountInfo } from "@/lib/services/oauth/account-info"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

const VALID_PLATFORMS: OAuthPlatform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "pinterest",
  "youtube",
  "tiktok",
]

const REDIRECT_SUCCESS = "/settings/connections?success=connected"
const REDIRECT_ERROR = "/settings/connections?error="

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

  // oauth_connections.tenant_id référence tenants(id) (aligné avec posts/documents).
  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}no_tenant`
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

  // Échange code → token.
  // Twitter : client confidentiel → HTTP Basic Auth + PKCE (code_verifier = les
  // 43 premiers caractères du state, cf. le code_challenge "plain" de /authorize).
  // Autres : client_secret dans le corps (form-urlencoded).
  const isTwitter = platform === "twitter"
  const tokenHeaders: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  }
  const tokenParams: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUrl,
    // TikTok porte l'identifiant client sous `client_key` (pas `client_id`).
    [config.clientIdParam ?? "client_id"]: clientId,
  }
  if (isTwitter) {
    tokenParams.code_verifier = state.slice(0, 43)
    tokenHeaders.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
  } else {
    tokenParams.client_secret = clientSecret
  }

  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: tokenHeaders,
    body: new URLSearchParams(tokenParams),
  })

  if (!tokenRes.ok) {
    // Surface la vraie cause renvoyée par la plateforme (invalid_grant,
    // redirect_uri mismatch, invalid_client…) au lieu d'un message opaque.
    const errBody = await tokenRes.text().catch(() => "")
    let detail = `HTTP ${tokenRes.status}`
    try {
      const parsed = JSON.parse(errBody)
      detail = parsed.error_description || parsed.error || parsed.detail || detail
    } catch {
      if (errBody) detail = errBody.slice(0, 200)
    }
    console.error(`[oauth:${platform}] token_exchange_failed:`, tokenRes.status, errBody.slice(0, 500))
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${REDIRECT_ERROR}token_exchange_failed&detail=${encodeURIComponent(detail.slice(0, 200))}`
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

  // Récupération des infos de compte réelles depuis la plateforme
  let accountId = user.id
  let accountName = user.email ?? "Compte connecté"
  let accountAvatar: string | null = null

  try {
    const info = await fetchAccountInfo(platform as OAuthPlatform, accessToken)
    accountId = info.accountId
    accountName = info.accountName
    accountAvatar = info.accountAvatar
  } catch {
    // Non bloquant — on continue avec les valeurs de fallback
    // (l'utilisateur pourra reconnecter pour corriger)
  }

  // Upsert connexion OAuth en DB
  const { error: dbError } = await supabase.from("oauth_connections").upsert(
    {
      tenant_id: tenantId,
      platform,
      account_id: accountId,
      account_name: accountName,
      account_avatar: accountAvatar,
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
