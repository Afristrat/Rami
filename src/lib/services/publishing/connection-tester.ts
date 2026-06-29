/**
 * Utilitaire de test de connexion OAuth pour chaque plateforme de publication.
 * Vérifie que le token d'accès est valide en appelant un endpoint léger de l'API.
 */

export interface ConnectionTestResult {
  platform: string
  status: "ok" | "error" | "not_configured"
  message: string
  latency_ms?: number
}

export async function testPublishingConnection(
  platform: string,
  accessToken: string
): Promise<ConnectionTestResult> {
  const start = Date.now()

  try {
    switch (platform) {
      case "twitter": {
        // GET /2/users/me — vérifie que le token est valide
        const tRes = await fetch("https://api.twitter.com/2/users/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        return {
          platform,
          status: tRes.ok ? "ok" : "error",
          message: tRes.ok ? "Connected" : `HTTP ${tRes.status}`,
          latency_ms: Date.now() - start,
        }
      }

      case "linkedin": {
        const lRes = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        return {
          platform,
          status: lRes.ok ? "ok" : "error",
          message: lRes.ok ? "Connected" : `HTTP ${lRes.status}`,
          latency_ms: Date.now() - start,
        }
      }

      case "facebook":
      case "instagram": {
        const fRes = await fetch(
          `https://graph.facebook.com/v21.0/me?access_token=${encodeURIComponent(accessToken)}`
        )
        return {
          platform,
          status: fRes.ok ? "ok" : "error",
          message: fRes.ok ? "Connected" : `HTTP ${fRes.status}`,
          latency_ms: Date.now() - start,
        }
      }

      case "pinterest": {
        const pRes = await fetch("https://api.pinterest.com/v5/user_account", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        return {
          platform,
          status: pRes.ok ? "ok" : "error",
          message: pRes.ok ? "Connected" : `HTTP ${pRes.status}`,
          latency_ms: Date.now() - start,
        }
      }

      case "youtube": {
        const yRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&mine=true`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        return {
          platform,
          status: yRes.ok ? "ok" : "error",
          message: yRes.ok ? "Connected" : `HTTP ${yRes.status}`,
          latency_ms: Date.now() - start,
        }
      }

      default:
        return {
          platform,
          status: "not_configured",
          message: "Plateforme non supportée",
        }
    }
  } catch (err) {
    return {
      platform,
      status: "error",
      message: err instanceof Error ? err.message : "Erreur inconnue",
      latency_ms: Date.now() - start,
    }
  }
}
