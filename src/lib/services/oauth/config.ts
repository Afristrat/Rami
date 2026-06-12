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

export interface OAuthConfig {
  platform: OAuthPlatform
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
  clientIdEnv: string
  clientSecretEnv: string
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
}

export function getOAuthConfig(platform: OAuthPlatform): OAuthConfig {
  return OAUTH_CONFIGS[platform]
}
