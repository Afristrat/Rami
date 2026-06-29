/**
 * Configuration centralisée des providers OAuth par plateforme.
 * Les scopes sont définis selon les besoins de publication RAMI.
 */

export type OAuthPlatform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "pinterest"
  | "youtube"
  | "tiktok"

export interface OAuthConfig {
  platform: OAuthPlatform
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
  clientIdEnv: string
  clientSecretEnv: string
  /**
   * Nom du paramètre portant l'identifiant client dans les requêtes OAuth
   * (authorize + token + refresh). Défaut `client_id` ; TikTok impose `client_key`.
   */
  clientIdParam?: string
  /** Paramètres supplémentaires à ajouter à l'URL d'autorisation (ex. Google `access_type=offline`). */
  authorizeExtraParams?: Record<string, string>
  /** Séparateur des scopes dans l'URL d'autorisation. Défaut espace ; TikTok impose une virgule. */
  scopeSeparator?: string
}

export const OAUTH_CONFIGS: Record<OAuthPlatform, OAuthConfig> = {
  twitter: {
    platform: "twitter",
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    clientIdEnv: "TWITTER_CLIENT_ID",
    clientSecretEnv: "TWITTER_CLIENT_SECRET",
  },
  linkedin: {
    platform: "linkedin",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    // OpenID Connect (Sign In) + partage (Share on LinkedIn). r_basicprofile est
    // un scope legacy non disponible avec OIDC → remplacé par openid/profile/email.
    scopes: ["openid", "profile", "email", "w_member_social"],
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
  },
  instagram: {
    platform: "instagram",
    // Instagram utilise le flow Facebook Graph API
    authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement",
    ],
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
  },
  facebook: {
    platform: "facebook",
    authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: ["pages_show_list", "pages_manage_posts", "pages_read_engagement"],
    clientIdEnv: "META_APP_ID",
    clientSecretEnv: "META_APP_SECRET",
  },
  pinterest: {
    platform: "pinterest",
    authorizeUrl: "https://www.pinterest.com/oauth/",
    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    scopes: ["boards:read", "pins:read", "pins:write"],
    clientIdEnv: "PINTEREST_APP_ID",
    clientSecretEnv: "PINTEREST_APP_SECRET",
  },
  youtube: {
    platform: "youtube",
    // Flow Google OAuth 2.0. `access_type=offline` + `prompt=consent` sont
    // requis pour obtenir un refresh_token (sinon Google n'en renvoie qu'au
    // tout premier consentement).
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    clientIdEnv: "YOUTUBE_CLIENT_ID",
    clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
    authorizeExtraParams: { access_type: "offline", prompt: "consent" },
  },
  tiktok: {
    platform: "tiktok",
    // TikTok v2 : l'identifiant client s'appelle `client_key` (pas `client_id`)
    // et les scopes sont séparés par des virgules dans l'URL d'autorisation.
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "video.upload", "video.publish"],
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    clientIdParam: "client_key",
    scopeSeparator: ",",
  },
}

export function getOAuthConfig(platform: OAuthPlatform): OAuthConfig {
  return OAUTH_CONFIGS[platform]
}
