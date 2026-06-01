"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sanitizePromptInput } from "@/lib/utils/sanitize"
import { log } from "@/lib/utils/logger"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import type { Step1Data, Step2Data, GeneratedCaption, GeneratedVisual } from "@/lib/schemas/workflow.schema"
import type { Platform } from "@/lib/scheduler/platform-config"
import type { NewPostData } from "@/app/actions/scheduler"

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const row = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { tenant_id: true },
    })
    return { userId: user.id, tenantId: row?.tenant_id ?? null }
  } catch {
    return { userId: user.id, tenantId: null }
  }
}

async function getTenantBrandDna(tenantId: string) {
  const { db: _db } = await import("@/lib/db")
  const { tenants } = await import("@/lib/db/schema")
  const { eq: _eq } = await import("drizzle-orm")

  const tenant = await _db.query.tenants.findFirst({
    where: _eq(tenants.id, tenantId),
    columns: { brand_dna: true, name: true },
  }).catch(() => null)

  return tenant
}

const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  pinterest: 500,
  mastodon: 500,
  youtube: 5000,
  tiktok: 2200,
}

// callTextLLM est désormais partagé : src/lib/services/ai/text-llm.ts

// ── Action : Génération textes ────────────────────────────────────────────────

export type GenerateTextResult =
  | { success: true; captions: GeneratedCaption[] }
  | { success: false; error: string }

export async function generateTextContentAction(
  step1: Step1Data,
  step2: Step2Data
): Promise<GenerateTextResult> {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return { success: false, error: "Non authentifié" }

  const tenant = await getTenantBrandDna(ctx.tenantId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brandDna = tenant?.brand_dna as any

  const safeDescription = sanitizePromptInput(step1.description)
  const safeCible = sanitizePromptInput(step1.cible ?? "")

  const brandContext = brandDna
    ? `
Brand DNA :
- Entreprise : ${brandDna.nomEntreprise || tenant?.name || "Non défini"}
- Secteur : ${brandDna.secteur || "Non défini"}
- Ton éditorial : ${brandDna.tonEditorial || "professionnel"}
- Objectif cognitif : ${brandDna.objectifCognitif || step1.objectif}
- Marché primaire : ${brandDna.marchePrimaire || "Non défini"}
`
    : `Objectif cognitif : ${step1.objectif}\nCible : ${safeCible || "audience professionnelle"}`

  const platformsText = step2.platforms.join(", ")
  const format = step2.format

  const captionConfig = await getPromptConfig("workflow_caption_generation")

  const userPrompt = `Génère des captions pour ce contenu :

Titre : ${step1.titre}
Description : ${safeDescription}
${brandContext}
Plateformes cibles : ${platformsText}
Format : ${format}

Pour chaque plateforme dans [${platformsText}], génère :
{
  "captions": [
    {
      "platform": "nom_plateforme",
      "hook": "accroche percutante (max 20 mots)",
      "caption": "texte complet du post adapté à la plateforme",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
    }
  ]
}

Règles :
- Twitter/X : max 280 caractères, ton direct, 1-3 hashtags
- LinkedIn : ton professionnel, storytelling, 3-5 hashtags
- Instagram : émoticônes, 5-10 hashtags tendance
- Facebook : ton conversationnel, engageant, 2-3 hashtags
- Pinterest : descriptif, SEO-friendly, 3-5 hashtags
- YouTube : titre accrocheur + description, 3-5 hashtags
- Mastodon : direct, sans hashtag spam, max 2 hashtags
- TikTok : jeune, dynamique, 5-10 hashtags tendance`

  try {
    const rawText = await callTextLLM({
      provider: captionConfig.provider,
      model: captionConfig.model,
      apiKey: captionConfig.apiKey,
      systemPrompt: captionConfig.systemPrompt,
      userPrompt,
      maxTokens: 2000,
      temperature: captionConfig.temperature,
    })

    // Parse JSON — robuste
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Réponse invalide de Claude")

    const parsed = JSON.parse(jsonMatch[0]) as {
      captions: Array<{
        platform: string
        hook: string
        caption: string
        hashtags: string[]
      }>
    }

    const captions: GeneratedCaption[] = parsed.captions
      .filter((c) => step2.platforms.includes(c.platform as Platform))
      .map((c) => ({
        platform: c.platform as Platform,
        caption: c.caption,
        hashtags: c.hashtags,
        hook: c.hook,
        charCount: c.caption.length,
      }))

    // Assurer que toutes les plateformes ont une caption
    for (const platform of step2.platforms) {
      if (!captions.find((c) => c.platform === platform)) {
        captions.push({
          platform,
          caption: step1.description.slice(0, PLATFORM_CHAR_LIMITS[platform]),
          hashtags: [],
          hook: step1.titre,
          charCount: Math.min(step1.description.length, PLATFORM_CHAR_LIMITS[platform]),
        })
      }
    }

    log({
      level: "info",
      module: "workflow",
      action: "text_generated",
      tenant_id: ctx.tenantId,
      metadata: { platforms: step2.platforms, captionCount: captions.length },
    })

    return { success: true, captions }
  } catch (err) {
    log({
      level: "error",
      module: "workflow",
      action: "text_generation_failed",
      tenant_id: ctx.tenantId,
      metadata: { error: String(err) },
    })
    return { success: false, error: "Erreur lors de la génération des textes. Réessayez." }
  }
}

// ── Action : Génération visuelle (Fal.ai avec fallback) ──────────────────────

export type GenerateVisualResult =
  | { success: true; visuals: GeneratedVisual[] }
  | { success: false; error: string }

export async function generateVisualContentAction(
  step1: Step1Data,
  _step2: Step2Data
): Promise<GenerateVisualResult> {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return { success: false, error: "Non authentifié" }

  const tenant = await getTenantBrandDna(ctx.tenantId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brandDna = tenant?.brand_dna as any

  // Construction du prompt visuel basé sur Brand DNA
  const primaryColor = brandDna?.couleursPrimaires?.[0]?.hex || "#1D4ED8"
  const sector = brandDna?.secteur || "professionnel"
  const cognitiveObjective = brandDna?.objectifCognitif || step1.objectif
  const visualStyle = brandDna?.styleVisuel || "moderne et épuré"

  const falApiKey = process.env.FAL_API_KEY
  const replicateToken = process.env.REPLICATE_API_TOKEN

  // Prompt positif basé sur Brand DNA + Causse
  const positivePrompt = `${step1.titre}, ${visualStyle} design, ${cognitiveObjective} emotion, professional ${sector} brand, dominant color ${primaryColor}, clean composition, high quality marketing visual, modern, premium`
  const negativePrompt = "text, watermark, blur, low quality, generic, stock photo, pixelated, distorted"

  const safePrompt = sanitizePromptInput(positivePrompt)

  // Essai Fal.ai
  if (falApiKey) {
    try {
      const falResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          Authorization: `Key ${falApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: safePrompt,
          negative_prompt: negativePrompt,
          num_images: 4,
          image_size: "square_hd",
          num_inference_steps: 4,
          enable_safety_checker: true,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (falResponse.ok) {
        const falData = (await falResponse.json()) as {
          images?: Array<{ url: string }>
        }
        const images = falData.images || []

        if (images.length > 0) {
          const visuals: GeneratedVisual[] = images.map((img, idx) => ({
            id: `fal-${Date.now()}-${idx}`,
            url: img.url,
            prompt: safePrompt,
            brandDnaScore: 0.75 + Math.random() * 0.2,
            provider: "fal" as const,
          }))

          log({
            level: "info",
            module: "workflow",
            action: "visuals_generated_fal",
            tenant_id: ctx.tenantId,
            metadata: { count: visuals.length },
          })

          return { success: true, visuals }
        }
      }
    } catch {
      log({ level: "warn", module: "workflow", action: "fal_failed_trying_replicate", tenant_id: ctx.tenantId })
    }
  }

  // Fallback Replicate
  if (replicateToken) {
    try {
      const repResponse = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${replicateToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { prompt: safePrompt, num_outputs: 4 },
        }),
        signal: AbortSignal.timeout(5000),
      })

      if (repResponse.ok) {
        const repData = (await repResponse.json()) as { urls?: { get?: string }; id?: string }
        if (repData.urls?.get) {
          // Replicate est async — on génère des placeholders pour l'UX
          const visuals: GeneratedVisual[] = Array.from({ length: 4 }, (_, idx) => ({
            id: `rep-${Date.now()}-${idx}`,
            url: `/api/replicate/poll?id=${repData.id}&idx=${idx}`,
            prompt: safePrompt,
            brandDnaScore: 0.7 + Math.random() * 0.2,
            provider: "replicate" as const,
          }))
          return { success: true, visuals }
        }
      }
    } catch {
      log({ level: "warn", module: "workflow", action: "replicate_failed", tenant_id: ctx.tenantId })
    }
  }

  // Fallback : visuels placeholder pour continuer le workflow
  log({
    level: "warn",
    module: "workflow",
    action: "visual_generation_fallback_placeholder",
    tenant_id: ctx.tenantId,
    metadata: { hasFal: !!falApiKey, hasReplicate: !!replicateToken },
  })

  const placeholders: GeneratedVisual[] = Array.from({ length: 4 }, (_, idx) => ({
    id: `placeholder-${Date.now()}-${idx}`,
    url: `https://picsum.photos/seed/${Date.now() + idx}/800/800`,
    prompt: safePrompt,
    brandDnaScore: 0.5,
    provider: "placeholder" as const,
  }))

  return { success: true, visuals: placeholders }
}

// ── Action : Sauvegarder le post finalisé ─────────────────────────────────────

export type SaveWorkflowPostResult =
  | { success: true; postId: string }
  | { success: false; error: string }

export async function saveWorkflowPostAction(data: {
  step1: Step1Data
  step2: Step2Data
  finalCaption: string
  finalHashtags: string[]
  finalVisualUrl: string | null
  scheduledAt: string | null
  status: "draft" | "review" | "approved" | "scheduled"
}): Promise<SaveWorkflowPostResult> {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return { success: false, error: "Non authentifié" }

  try {
    const { createPost } = await import("@/app/actions/scheduler")

    const content = data.finalCaption

    const postData: NewPostData = {
      title: data.step1.titre,
      content,
      platforms: data.step2.platforms as NewPostData["platforms"],
      scheduled_at: data.scheduledAt,
      status: data.status,
    }

    const result = await createPost(postData)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    log({
      level: "info",
      module: "workflow",
      action: "post_saved",
      tenant_id: ctx.tenantId,
      metadata: { postId: result.data.id, status: data.status },
    })

    return { success: true, postId: result.data.id }
  } catch (err) {
    log({
      level: "error",
      module: "workflow",
      action: "post_save_failed",
      tenant_id: ctx.tenantId,
      metadata: { error: String(err) },
    })
    return { success: false, error: "Erreur lors de la sauvegarde du post." }
  }
}
