/**
 * Publisher LinkedIn — REST API v2
 * UGC Posts : POST /v2/ugcPosts
 * Images : Assets API (registerUpload → upload binaire JPEG → shareMediaCategory IMAGE)
 * Limite : 3 000 caractères
 */

import type { PublisherInput, PublishResult } from "./types"

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2"
const MAX_CHARS = 3000

export async function publishToLinkedIn(input: PublisherInput): Promise<PublishResult> {
  const { accessToken, content, accountId, mediaUrls } = input

  if (!accountId) {
    return {
      platform: "linkedin",
      status: "failed",
      error: "LinkedIn : ID du compte manquant (author URN requis).",
    }
  }

  const text = content.length > MAX_CHARS ? content.slice(0, MAX_CHARS - 1) + "…" : content

  // L'author URN peut être sous la forme "urn:li:person:XXX" ou juste "XXX"
  const authorUrn = accountId.startsWith("urn:li:")
    ? accountId
    : `urn:li:person:${accountId}`

  // ── Image (optionnelle) : enregistrer + uploader le binaire, récupérer l'asset URN
  const firstImage = mediaUrls?.find((u) => typeof u === "string" && u.length > 0)
  let assetUrn: string | null = null
  if (firstImage) {
    try {
      assetUrn = await uploadLinkedInImage(accessToken, authorUrn, firstImage)
    } catch (err) {
      // Pas de dégradation silencieuse : l'utilisateur attend une image.
      return {
        platform: "linkedin",
        status: "failed",
        error: `LinkedIn (upload image) : ${err instanceof Error ? err.message : "échec"}`,
      }
    }
  }

  const shareContent: Record<string, unknown> = {
    shareCommentary: { text },
    shareMediaCategory: assetUrn ? "IMAGE" : "NONE",
  }
  if (assetUrn) {
    shareContent.media = [{ status: "READY", media: assetUrn }]
  }

  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": shareContent,
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  }

  try {
    const res = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (errorBody as any)?.message || `HTTP ${res.status}`
      return {
        platform: "linkedin",
        status: "failed",
        error: `LinkedIn : ${detail}`,
      }
    }

    // L'ID est dans le header X-RestLi-Id
    const postUrn = res.headers.get("x-restli-id") ?? ""
    const postId = postUrn.split(":").pop() ?? postUrn

    return {
      platform: "linkedin",
      status: "published",
      postId: postUrn,
      postUrl: postId ? `https://www.linkedin.com/feed/update/${postUrn}` : undefined,
    }
  } catch (err) {
    return {
      platform: "linkedin",
      status: "failed",
      error: `LinkedIn : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}

// ── Upload image via l'Assets API LinkedIn ───────────────────────────────────
// 1. registerUpload (recette feedshare-image, owner = author URN)
// 2. fetch de l'image source + conversion JPEG (LinkedIn refuse le WebP)
// 3. PUT du binaire vers l'uploadUrl signé
// Renvoie l'asset URN (urn:li:digitalmediaAsset:XXX) prêt à référencer.
async function uploadLinkedInImage(
  accessToken: string,
  authorUrn: string,
  imageUrl: string
): Promise<string> {
  // 1. registerUpload
  const regRes = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: authorUrn,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  })

  if (!regRes.ok) {
    const b = await regRes.text().catch(() => "")
    throw new Error(`registerUpload ${regRes.status} ${b.slice(0, 160)}`)
  }

  const reg = (await regRes.json()) as LinkedInRegisterUploadResponse
  const asset = reg.value?.asset
  const uploadUrl =
    reg.value?.uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl
  if (!asset || !uploadUrl) {
    throw new Error("registerUpload : asset ou uploadUrl manquant")
  }

  // 2. Télécharger l'image source + convertir en JPEG (WebP non supporté par LinkedIn)
  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) })
  if (!imgRes.ok) throw new Error(`téléchargement image ${imgRes.status}`)
  const srcBuffer = Buffer.from(await imgRes.arrayBuffer())
  const sharp = (await import("sharp")).default
  const jpegBuffer = await sharp(srcBuffer).jpeg({ quality: 90 }).toBuffer()

  // 3. Upload binaire (PUT) vers l'URL signée
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/jpeg",
    },
    body: new Uint8Array(jpegBuffer),
  })
  if (!putRes.ok) {
    const b = await putRes.text().catch(() => "")
    throw new Error(`upload binaire ${putRes.status} ${b.slice(0, 160)}`)
  }

  return asset
}

// ── Type partiel de la réponse registerUpload ────────────────────────────────
interface LinkedInRegisterUploadResponse {
  value?: {
    asset?: string
    uploadMechanism?: {
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: {
        uploadUrl?: string
      }
    }
  }
}
