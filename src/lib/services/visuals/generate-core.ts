// ============================================================
// Cœur de génération de visuels — moteur partagé (US-052)
// ------------------------------------------------------------
// Module serveur PUR (pas de 'use server') : appelable à la fois par
//   • l'action UI `generateVisualsAction` (contexte tenant dérivé de la session)
//   • la route API publique v1 (contexte tenant dérivé de la clé d'API)
// Le contexte tenant est fourni EXPLICITEMENT via `VisualGenContext` : le cœur
// n'appelle JAMAIS supabase.auth.getUser() ni le quota de session. Aucune
// duplication de la logique de génération (contrainte design.md).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { generateBatch } from '@/lib/services/image-generation'
import {
  compileBrandDNAToPrompts,
  type PerformancePrior,
} from '@/lib/services/brand-dna/prompt-compiler'
import { normalizeBrandDNA } from '@/lib/services/brand-dna/normalize'
import { buildPerformancePrior } from '@/lib/services/metrics/attribution'
import { scoreImageWithVision } from '@/lib/services/brand-dna/vision-scorer'
import { storeVisual } from '@/lib/services/storage/visual-storage'
import { GenerateBriefSchema, type GenerateBriefInput } from '@/lib/schemas/visual.schema'
import type { GeneratedVisual } from '@/lib/services/image-generation/types'
import { hasFeatureAccess, incrementGenerationCount } from '@/lib/billing'
import { log } from '@/lib/utils/logger'
import { captureServerEvent } from '@/lib/utils/posthog-server'
import { CAMPAIGN_TYPES } from '@/lib/config/campaign-types'

export interface VisualGenerationResult {
  success: boolean
  session_id: string
  visuals: GeneratedVisual[]
  errors?: string[]
  error?: string
  /** Présent si le quota est dépassé — le client affiche l'UpgradeModal */
  quota_exceeded?: {
    plan: string
    count: number
    limit: number
  }
}

/**
 * Contexte tenant EXPLICITE pour la génération de visuels.
 * Construit par chaque appelant (action de session OU route API) afin que le
 * cœur soit agnostique de la provenance de l'authentification.
 */
export interface VisualGenContext {
  /** Client Supabase à utiliser pour la persistance (server-RLS en session, service-role en API). */
  supabase: SupabaseClient
  /** Identité tenant utilisée pour le stockage MinIO et la persistance des sessions. */
  tenantId: string
  /** Plan d'abonnement (gouverne le watermark FREE). */
  plan: string
  /** Brand DNA brut (colonne `tenants.brand_dna`) — normalisé dans le cœur. */
  brandDNARaw: unknown
  /** Id de la ligne `tenants` si elle existe (performance prior + incrément quota) ; null sinon. */
  tenantRowId: string | null
  /** Acteur attribué aux logs / PostHog / persistance (`user.id` en session, `tenantId` en API). */
  actorId: string
}

/**
 * Persiste une session de génération + images dans Supabase.
 * Les images sont stockées avec URLs permanentes (MinIO) + champs Vision AI.
 */
async function persistVisualSession(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  brief: string,
  platform: string,
  sessionSeed: number,
  visuals: GeneratedVisual[],
  performancePrior: PerformancePrior | null
): Promise<string | null> {
  try {
    const { data: session, error: sessionError } = await supabase
      .from('visual_sessions')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        brief,
        platform,
        session_seed: sessionSeed,
        image_count: visuals.length,
      })
      .select('id')
      .single()

    if (sessionError || !session) return null

    const sessionId = session.id

    // Insérer toutes les images en batch (avec champs MinIO + Vision AI)
    const imageRows = visuals.map((v) => {
      const ext = v as GeneratedVisual & Record<string, unknown>
      return {
        session_id:          sessionId,
        tenant_id:           tenantId,
        direction_id:        v.direction.id,
        direction_name:      v.direction.name,
        direction_style:     v.direction.style,
        direction_emotion:   v.direction.emotion,
        image_url:           v.image.url,
        provider:            v.provider,
        brand_dna_score:     v.brand_dna_score,
        prompt_used:         v.prompt_used,
        seed:                v.seed,
        width:               v.image.width,
        height:              v.image.height,
        // Vision AI + MinIO (présents si stockage réussi)
        minio_path:          ext._minio_path as string | undefined,
        public_url:          v.image.url !== ext._minio_path ? v.image.url : undefined,
        file_size_bytes:     ext._file_size_bytes as number | undefined,
        has_watermark:       (ext._has_watermark as boolean) ?? false,
        vision_scored:       (ext._vision_scored as boolean) ?? false,
        dominant_color_hex:  ext._dominant_color as string | undefined,
        model:               ext._model as string | undefined,
        // Performance prior utilisé pour cette génération (US-008) — null si Causse pur
        performance_prior:   performancePrior,
      }
    })

    const { error: imagesError } = await supabase
      .from('visual_session_images')
      .insert(imageRows)

    if (imagesError) {
      // Non-bloquant : les visuels sont déjà générés et retournés au client
      void imagesError
    }

    return sessionId
  } catch (err) {
    // Persistance non bloquante mais observable (US-021 — Sentry en prod)
    log({
      level: 'error',
      module: 'visual.generate-core',
      action: 'persist_session_failed',
      tenant_id: tenantId,
      metadata: { error: err instanceof Error ? err.message : String(err) },
    })
    return null
  }
}

/**
 * Génère 4 directions × N images à partir d'un brief, pour un contexte tenant
 * EXPLICITE. Cœur partagé entre l'action de session et l'API publique v1.
 *
 * Pipeline SOP-003 :
 *   1. Valider le brief (Zod)
 *   2. Compiler 4 StructuredPrompts depuis le Brand DNA
 *   3. Générer les images (provider chain : Fal → Replicate → Together)
 *   4. Valider via Vision AI (score ≥ 70, 1 retry max)
 *   5. Stocker en MinIO (WebP, watermark si plan FREE)
 *   6. Persister la session en DB (URLs permanentes)
 *   7. Retourner les URLs permanentes
 *
 * Ne réalise AUCUNE vérification d'authentification ni de quota : c'est la
 * responsabilité de l'appelant (action de session ou route API).
 */
export async function generateVisuals(
  ctx: VisualGenContext,
  input: GenerateBriefInput
): Promise<VisualGenerationResult> {
  // Validation Zod
  const parsed = GenerateBriefSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      session_id: '',
      visuals: [],
      error: parsed.error.issues[0]?.message ?? 'Données invalides',
    }
  }

  const { brief: rawBrief, platform, images_per_direction, campaignType } = parsed.data

  // Prepend campaign type prompt modifier if selected
  const campaignModifier = campaignType
    ? CAMPAIGN_TYPES.find((ct) => ct.id === campaignType)?.promptModifier
    : undefined
  const brief = campaignModifier
    ? `[${campaignModifier}] ${rawBrief}`
    : rawBrief

  // Normalise la shape PLATE réelle → interface nestée du compiler (résout IDs Causse → HEX).
  const brandDNA = normalizeBrandDNA(ctx.brandDNARaw)

  // Watermark si plan FREE (pas de feature visual_engine_no_watermark)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addWatermark = !hasFeatureAccess(ctx.plan as any, 'visual_engine_no_watermark')

  // Couleurs cibles + émotion pour Vision Scorer
  const targetColors: string[] = brandDNA.color_palette
    ? (brandDNA.color_palette as Array<{ hex: string } | string>)
        .map((c) => (typeof c === 'string' ? c : c.hex))
        .filter(Boolean)
    : []
  const targetEmotion = brandDNA.cognitive_objective as string | undefined

  // Performance prior (US-008) — couleurs/styles gagnants réels, gaté par volume.
  // Retourne null tant que < seuil de posts mesurés → fallback Causse pur.
  const performancePrior = ctx.tenantRowId
    ? await buildPerformancePrior(ctx.tenantRowId, brandDNA.identity?.sector ?? null)
    : null

  // Compiler 4 directions de prompts
  const sessionSeed = Math.floor(Math.random() * 100_000)
  const sessionId = crypto.randomUUID()
  const structuredPrompts = compileBrandDNAToPrompts(brandDNA, brief, platform, sessionSeed, performancePrior)

  const allVisuals: GeneratedVisual[] = []
  const errors: string[] = []

  // Générer + valider + stocker chaque direction en parallèle
  const directionResults = await Promise.allSettled(
    structuredPrompts.map(async (sp, directionIndex) => {
      try {
        const results = await generateBatch(
          {
            positive_prompt: sp.positive_prompt,
            negative_prompt: sp.negative_prompt,
            width: sp.parameters.width,
            height: sp.parameters.height,
            guidance_scale: sp.parameters.guidance_scale,
            num_inference_steps: sp.parameters.num_inference_steps,
            seed: sp.parameters.seed,
            num_images: 1,
          },
          images_per_direction
        )

        const directionVisuals: GeneratedVisual[] = []

        for (let imgIndex = 0; imgIndex < results.length; imgIndex++) {
          const result = results[imgIndex]

          for (const img of result.images) {
            // Vision AI — score initial
            let visionResult = await scoreImageWithVision({
              imageUrl:     img.url,
              targetColors,
              targetEmotion,
              promptUsed:   sp.positive_prompt,
            })

            // Retry si score < 70 et Vision AI disponible (max 1 retry)
            if (visionResult.vision_scored && visionResult.score < 70) {
              const retry = await generateBatch(
                {
                  positive_prompt:       sp.positive_prompt,
                  negative_prompt:       sp.negative_prompt,
                  width:                 sp.parameters.width,
                  height:                sp.parameters.height,
                  guidance_scale:        sp.parameters.guidance_scale,
                  num_inference_steps:   sp.parameters.num_inference_steps,
                  seed:                  sp.parameters.seed + 1,
                  num_images:            1,
                },
                1
              )
              const retryImg = retry[0]?.images[0]
              if (retryImg) {
                const retryScore = await scoreImageWithVision({
                  imageUrl:     retryImg.url,
                  targetColors,
                  targetEmotion,
                  promptUsed:   sp.positive_prompt,
                })
                if (retryScore.score > visionResult.score) {
                  Object.assign(img, retryImg)
                  visionResult = retryScore
                }
              }
            }

            // MinIO — stocker en WebP permanent
            const stored = await storeVisual({
              imageUrl:    img.url,
              tenantId:    ctx.tenantId,
              sessionId,
              directionId: sp.direction.id,
              index:       directionIndex * images_per_direction + imgIndex,
              addWatermark,
            })

            const permanentUrl = stored.data?.public_url
              ?? stored.data?.signed_url
              ?? img.url

            directionVisuals.push({
              direction:       sp.direction,
              image:           {
                ...img,
                url:    permanentUrl,
                width:  stored.data?.width  ?? img.width,
                height: stored.data?.height ?? img.height,
              },
              provider:        result.provider,
              brand_dna_score: visionResult.score,
              prompt_used:     sp.positive_prompt,
              seed:            img.seed,
              // Extra metadata portée dans l'objet pour persistVisualSession
              _minio_path:       stored.data?.minio_path,
              _vision_scored:    visionResult.vision_scored,
              _dominant_color:   visionResult.dominant_color_hex,
              _has_watermark:    addWatermark,
              _file_size_bytes:  stored.data?.file_size_bytes,
              _model:            result.model,
            } as GeneratedVisual & Record<string, unknown>)
          }
        }

        return directionVisuals
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`Direction ${sp.direction.name} : ${message}`)
        return []
      }
    })
  )

  directionResults.forEach((result) => {
    if (result.status === 'fulfilled') allVisuals.push(...result.value)
    else errors.push(result.reason?.message ?? 'Erreur inconnue')
  })

  if (allVisuals.length === 0) {
    // Échec runtime de génération (tous providers/directions ont échoué) → Sentry en prod (US-021)
    log({
      level: 'error',
      module: 'visual.generate-core',
      action: 'generation_failed',
      tenant_id: ctx.tenantId,
      user_id: ctx.actorId,
      metadata: { platform, plan: ctx.plan, directions: structuredPrompts.length, errors },
    })
    return {
      success: false,
      session_id: '',
      visuals: [],
      errors,
      error: 'Aucune image générée. Vérifiez les clés API.',
    }
  }

  // Persister la session en DB (avec URLs permanentes + champs Vision AI)
  await persistVisualSession(
    ctx.supabase,
    ctx.tenantId,
    ctx.actorId,
    brief,
    platform,
    sessionSeed,
    allVisuals,
    performancePrior
  )

  // Incrémenter compteur générations (atomique + reset-aware, US-020)
  if (ctx.tenantRowId) {
    await incrementGenerationCount(ctx.tenantRowId)
  }

  // PostHog — visual_generated
  captureServerEvent({
    distinctId: ctx.actorId,
    event: "visual_generated",
    properties: {
      tenant_id: ctx.tenantId,
      platform,
      image_count: allVisuals.length,
      directions: structuredPrompts.length,
      session_id: sessionId,
      plan: ctx.plan,
    },
  })

  // Nettoyer les champs privés avant retour client
  const cleanVisuals = allVisuals.map((v) => {
    const { _minio_path, _vision_scored, _dominant_color, _has_watermark, _file_size_bytes, _model, ...clean } = v as GeneratedVisual & Record<string, unknown>
    void _minio_path; void _vision_scored; void _dominant_color; void _has_watermark; void _file_size_bytes; void _model
    return clean as GeneratedVisual
  })

  return {
    success: true,
    session_id: sessionId,
    visuals: cleanVisuals,
    errors: errors.length > 0 ? errors : undefined,
  }
}
