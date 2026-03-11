/**
 * Publisher Instagram — Graph API v21 (via Media Containers)
 * Flow : POST /{ig-user-id}/media → POST /{ig-user-id}/media_publish
 * Instagram ne supporte pas les posts texte seul → image obligatoire.
 * Si pas d'image, on signale l'erreur clairement.
 */

import type { PublisherInput, PublishResult } from "./types"

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"
const MAX_CAPTION = 2200

export async function publishToInstagram(input: PublisherInput): Promise<PublishResult> {
  const { accessToken, content, mediaUrls, accountId } = input

  if (!accountId) {
    return {
      platform: "instagram",
      status: "failed",
      error: "Instagram : ID du compte Business/Creator manquant.",
    }
  }

  // Instagram exige au moins une image
  const imageUrl = mediaUrls?.[0]
  if (!imageUrl) {
    return {
      platform: "instagram",
      status: "failed",
      error:
        "Instagram : une image est obligatoire pour publier. Ajoutez un visuel au post.",
    }
  }

  const caption =
    content.length > MAX_CAPTION ? content.slice(0, MAX_CAPTION - 1) + "…" : content

  try {
    // Étape 1 : Créer le conteneur média
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    })

    const containerRes = await fetch(
      `${GRAPH_API_BASE}/${accountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: containerParams,
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerData: any = await containerRes.json()

    if (!containerRes.ok || containerData?.error) {
      const detail =
        containerData?.error?.message ||
        containerData?.error?.error_user_msg ||
        `HTTP ${containerRes.status}`
      return {
        platform: "instagram",
        status: "failed",
        error: `Instagram (création média) : ${detail}`,
      }
    }

    const containerId: string = containerData?.id
    if (!containerId) {
      return {
        platform: "instagram",
        status: "failed",
        error: "Instagram : conteneur média non créé (id manquant).",
      }
    }

    // Étape 2 : Publier le conteneur
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    })

    const publishRes = await fetch(
      `${GRAPH_API_BASE}/${accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: publishParams,
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const publishData: any = await publishRes.json()

    if (!publishRes.ok || publishData?.error) {
      const detail =
        publishData?.error?.message ||
        publishData?.error?.error_user_msg ||
        `HTTP ${publishRes.status}`
      return {
        platform: "instagram",
        status: "failed",
        error: `Instagram (publication) : ${detail}`,
      }
    }

    const postId: string = publishData?.id ?? ""

    return {
      platform: "instagram",
      status: "published",
      postId,
      postUrl: postId
        ? `https://www.instagram.com/p/${postId}/`
        : undefined,
    }
  } catch (err) {
    return {
      platform: "instagram",
      status: "failed",
      error: `Instagram : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
