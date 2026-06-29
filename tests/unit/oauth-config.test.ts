import { OAUTH_CONFIGS, getOAuthConfig, type OAuthPlatform } from "@/lib/services/oauth/config"
import { VALID_PLATFORMS } from "@/lib/schemas/oauth.schema"

describe("oauth-config (providers de publication)", () => {
  it("chaque config a une URL d'autorisation, un token endpoint et des scopes non vides", () => {
    for (const platform of Object.keys(OAUTH_CONFIGS) as OAuthPlatform[]) {
      const cfg = OAUTH_CONFIGS[platform]
      expect(cfg.platform).toBe(platform)
      expect(cfg.authorizeUrl).toMatch(/^https:\/\//)
      expect(cfg.tokenUrl).toMatch(/^https:\/\//)
      expect(cfg.scopes.length).toBeGreaterThan(0)
      expect(cfg.clientIdEnv).toBeTruthy()
      expect(cfg.clientSecretEnv).toBeTruthy()
    }
  })

  it("VALID_PLATFORMS (routes OAuth) couvre exactement les clés de OAUTH_CONFIGS", () => {
    expect([...VALID_PLATFORMS].sort()).toEqual(
      (Object.keys(OAUTH_CONFIGS) as string[]).sort()
    )
  })

  it("YouTube utilise le flow Google avec refresh token (access_type=offline + prompt=consent)", () => {
    const yt = getOAuthConfig("youtube")
    expect(yt.authorizeUrl).toContain("accounts.google.com")
    expect(yt.scopes).toContain("https://www.googleapis.com/auth/youtube.upload")
    expect(yt.authorizeExtraParams).toMatchObject({ access_type: "offline", prompt: "consent" })
  })

  it("TikTok porte l'identifiant client sous `client_key` et sépare les scopes par des virgules", () => {
    const tt = getOAuthConfig("tiktok")
    expect(tt.clientIdParam).toBe("client_key")
    expect(tt.scopeSeparator).toBe(",")
    expect(tt.clientIdEnv).toBe("TIKTOK_CLIENT_KEY")
    expect(tt.scopes).toEqual(expect.arrayContaining(["video.upload", "video.publish"]))
  })

  it("les providers historiques utilisent le param `client_id` par défaut (pas d'override)", () => {
    for (const platform of ["twitter", "linkedin", "facebook", "instagram", "pinterest"] as const) {
      expect(getOAuthConfig(platform).clientIdParam).toBeUndefined()
    }
  })
})
