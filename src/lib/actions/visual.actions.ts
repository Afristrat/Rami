'use server'

// ============================================================
// Visual Actions — Server Actions pour la génération de visuels
// SOP-003 : Orchestration complète Brand DNA → Images générées
//           → Vision AI scoring → MinIO storage → DB persist
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { generateBatch } from '@/lib/services/image-generation'
import {
  compileBrandDNAToPrompts,
  type PerformancePrior,
} from '@/lib/services/brand-dna/prompt-compiler'
import { normalizeBrandDNA } from '@/lib/services/brand-dna/normalize'
import { scoreCulturalCoherenceFromHex, type CulturalLevel } from '@/lib/services/brand-dna/cultural-scorer'
import { buildPerformancePrior } from '@/lib/services/metrics/attribution'
import { scoreImageWithVision } from '@/lib/services/brand-dna/vision-scorer'
import { storeVisual } from '@/lib/services/storage/visual-storage'
import { GenerateBriefSchema, GenerateBriefInput } from '@/lib/schemas/visual.schema'
import { GeneratedVisual } from '@/lib/services/image-generation/types'
import { checkGenerationQuota, getPlanConfig, hasFeatureAccess, incrementGenerationCount } from '@/lib/billing'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
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

export interface SaveToLibraryResult {
  success: boolean
  asset_id?: string
  error?: string
}

/**
 * Persiste une session de génération + images dans Supabase.
 * Les images sont stockées avec URLs permanentes (MinIO) + champs Vision AI.
 */
async function persistVisualSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
      module: 'visual.actions',
      action: 'persist_session_failed',
      tenant_id: tenantId,
      metadata: { error: err instanceof Error ? err.message : String(err) },
    })
    return null
  }
}

/**
 * Action principale : génère 4 directions × N images à partir d'un brief.
 *
 * Pipeline SOP-003 :
 *   1. Charger Brand DNA + plan tenant
 *   2. Compiler 4 StructuredPrompts
 *   3. Générer images (provider chain : Fal → Replicate → Together)
 *   4. Valider via Vision AI Claude Haiku (score ≥ 70, 1 retry max)
 *   5. Stocker en MinIO (WebP 1200px, watermark si plan FREE)
 *   6. Persister session en DB (URLs permanentes)
 *   7. Retourner URLs permanentes au client
 */
export async function generateVisualsAction(
  input: GenerateBriefInput
): Promise<VisualGenerationResult> {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, session_id: '', visuals: [], error: 'Non authentifié' }
  }

  // Vérification quota générations
  const quotaCheck = await checkGenerationQuota()
  if (!quotaCheck.allowed) {
    const planConfig = getPlanConfig(quotaCheck.plan)
    const limit = planConfig.generationsPerMonth
    return {
      success: false,
      session_id: '',
      visuals: [],
      error: `Quota de générations atteint (${quotaCheck.count}/${limit} ce mois). Passez au plan supérieur pour continuer.`,
      quota_exceeded: { plan: quotaCheck.plan, count: quotaCheck.count, limit },
    }
  }

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

  // Charger tenant + Brand DNA + plan
  const resolvedTenantId = await resolveUserTenant(supabase, user.id)
  const { data: tenantData } = !resolvedTenantId
    ? { data: null }
    : await supabase
        .from('tenants')
        .select('id, plan, brand_dna, generation_count')
        .eq('id', resolvedTenantId)
        .single()

  const tenantId: string = tenantData?.id ?? user.id
  const tenantPlan = (tenantData?.plan as string) ?? 'free'
  // Normalise la shape PLATE réelle → interface nestée du compiler (résout IDs Causse → HEX).
  const brandDNA = normalizeBrandDNA(tenantData?.brand_dna)

  // Watermark si plan FREE (pas de feature visual_engine_no_watermark)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addWatermark = !hasFeatureAccess(tenantPlan as any, 'visual_engine_no_watermark')

  // Couleurs cibles + émotion pour Vision Scorer
  const targetColors: string[] = brandDNA.color_palette
    ? (brandDNA.color_palette as Array<{ hex: string } | string>)
        .map((c) => (typeof c === 'string' ? c : c.hex))
        .filter(Boolean)
    : []
  const targetEmotion = brandDNA.cognitive_objective as string | undefined

  // Performance prior (US-008) — couleurs/styles gagnants réels, gaté par volume.
  // Retourne null tant que < seuil de posts mesurés → fallback Causse pur.
  const performancePrior = tenantData?.id
    ? await buildPerformancePrior(tenantData.id, brandDNA.identity?.sector ?? null)
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
              tenantId,
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
      module: 'visual.actions',
      action: 'generation_failed',
      tenant_id: tenantId,
      user_id: user.id,
      metadata: { platform, plan: tenantPlan, directions: structuredPrompts.length, errors },
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
    supabase,
    tenantId,
    user.id,
    brief,
    platform,
    sessionSeed,
    allVisuals,
    performancePrior
  )

  // Incrémenter compteur générations (atomique + reset-aware, US-020)
  if (tenantData?.id) {
    await incrementGenerationCount(tenantData.id)
  }

  // PostHog — visual_generated
  captureServerEvent({
    distinctId: user.id,
    event: "visual_generated",
    properties: {
      tenant_id: tenantId,
      platform,
      image_count: allVisuals.length,
      directions: structuredPrompts.length,
      session_id: sessionId,
      plan: tenantPlan,
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

/**
 * Enregistre une image générée dans la bibliothèque du tenant.
 * Télécharge depuis l'URL temporaire du provider → upload Supabase Storage → media_assets.
 */
export async function saveVisualToLibraryAction(params: {
  imageUrl: string
  directionId: number
  directionName: string
  brandDnaScore: number
  sessionImageId?: string
}): Promise<SaveToLibraryResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: 'Tenant introuvable' }

  try {
    // 1. Télécharger l'image depuis l'URL du provider
    const response = await fetch(params.imageUrl)
    if (!response.ok) throw new Error(`Téléchargement échoué : ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const contentType = response.headers.get('content-type') ?? 'image/webp'

    // 2. Construire le nom de fichier
    const ext = contentType.includes('png') ? 'png' : 'webp'
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 7)
    const filename = `rami-visual-d${params.directionId}-${timestamp}-${random}.${ext}`
    const storagePath = `${tenantId}/${filename}`

    // 3. Upload dans Supabase Storage (bucket rami-media)
    const { error: uploadError } = await supabase.storage
      .from('rami-media')
      .upload(storagePath, uint8Array, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw new Error(`Upload échoué : ${uploadError.message}`)

    // 4. Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('rami-media')
      .getPublicUrl(storagePath)

    const publicUrl = urlData?.publicUrl ?? null

    // 5. Insérer dans media_assets
    const { data: asset, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        filename,
        original_filename: filename,
        file_type: 'image',
        mime_type: contentType,
        file_size_bytes: uint8Array.byteLength,
        storage_path: storagePath,
        public_url: publicUrl,
        metadata: {
          source: 'visual_engine',
          direction_id: params.directionId,
          direction_name: params.directionName,
          brand_dna_score: params.brandDnaScore,
        },
      })
      .select('id')
      .single()

    if (dbError) throw new Error(`Insertion DB échouée : ${dbError.message}`)

    // 6. Mettre à jour visual_session_images si un ID est fourni
    if (params.sessionImageId) {
      await supabase
        .from('visual_session_images')
        .update({
          saved_to_library: true,
          library_asset_id: asset.id,
        })
        .eq('id', params.sessionImageId)
    }

    return { success: true, asset_id: asset.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log({ level: 'error', module: 'visual.actions', action: 'save_to_library_failed', tenant_id: tenantId, metadata: { error: message } })
    return { success: false, error: message }
  }
}

/**
 * Charge le Brand DNA du tenant courant pour préremplir l'interface
 */
export interface BrandDNASummary {
  sector?: string
  cognitiveObjective?: string
  primaryCulture?: string
  colorPalette?: Array<{ hex: string; name?: string; emotion?: string }>
}

export async function getTenantBrandDNAAction(): Promise<{
  hasDNA: boolean
  brandName?: string
  platform?: string
  cognitiveObjective?: string
  summary?: BrandDNASummary
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { hasDNA: false }

  const resolvedId = await resolveUserTenant(supabase, user.id)
  const { data } = !resolvedId ? { data: null } : await supabase
    .from('tenants')
    .select('brand_dna')
    .eq('id', resolvedId)
    .single()

  if (!data?.brand_dna) return { hasDNA: false }

  const dna = normalizeBrandDNA(data.brand_dna)
  const activePlatforms = dna.active_platforms ?? []

  const colorPalette = (dna.color_palette ?? [])
    .filter((c) => c.hex)
    .map((c) => ({ hex: c.hex as string, name: c.name, emotion: c.emotion }))
    .slice(0, 5)

  return {
    hasDNA: !!dna.identity?.name,
    brandName: dna.identity?.name,
    platform: activePlatforms[0] ?? 'instagram',
    cognitiveObjective: dna.cognitive_objective,
    summary: {
      sector: dna.identity?.sector,
      cognitiveObjective: dna.cognitive_objective,
      primaryCulture: dna.culture_markets?.primary_culture,
      colorPalette,
    },
  }
}

/**
 * Récupère les sessions visuelles récentes du tenant (pour l'historique)
 */
export async function getVisualSessionsAction(limit = 10): Promise<{
  sessions: Array<{
    id: string
    brief: string
    platform: string
    image_count: number
    created_at: string
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { sessions: [], error: 'Non authentifié' }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { sessions: [], error: 'Tenant introuvable' }

  const { data, error } = await supabase
    .from('visual_sessions')
    .select('id, brief, platform, image_count, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { sessions: [], error: error.message }

  return {
    sessions: (data ?? []).map((s) => ({
      id: s.id,
      brief: s.brief,
      platform: s.platform,
      image_count: s.image_count,
      created_at: s.created_at,
    })),
  }
}

// ============================================================
// Données réelles du panneau latéral du workflow « Créer un post »
// (remplace le mock WorkflowSidebar : score 0.87 + historique inventés)
// ============================================================

export interface WorkflowSidebarBrandDNA {
  name: string
  /** Couleurs HEX réelles de la palette de marque. */
  colors: string[]
  /** Plateformes actives réelles (identifiants). */
  platforms: string[]
  /** Ton éditorial réel (voiceTone), si renseigné. */
  tone?: string
  /** Score de cohérence culturelle RÉEL (palette × secteur) — absent si le secteur n'a pas de règle Causse. */
  culturalScore?: { score: number; level: CulturalLevel }
}

export interface WorkflowSidebarHistoryItem {
  id: string
  title: string
  platform: string
  status: string
  createdAt: string
}

/**
 * Charge les données RÉELLES du panneau latéral : Brand DNA du tenant (couleurs,
 * plateformes, ton, score de cohérence culturelle calculé) + historique des posts
 * récents. Aucune donnée fabriquée : état vide honnête si rien à afficher.
 */
export async function getWorkflowSidebarDataAction(): Promise<{
  brandDNA: WorkflowSidebarBrandDNA | null
  history: WorkflowSidebarHistoryItem[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { brandDNA: null, history: [] }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { brandDNA: null, history: [] }

  // ── Brand DNA réel ──
  const { data: tenant } = await supabase
    .from('tenants')
    .select('brand_dna')
    .eq('id', tenantId)
    .single()

  let brandDNA: WorkflowSidebarBrandDNA | null = null
  if (tenant?.brand_dna) {
    const dna = normalizeBrandDNA(tenant.brand_dna)
    const name = dna.identity?.name
    if (name) {
      const colors = (dna.color_palette ?? [])
        .map((c) => c.hex)
        .filter((h): h is string => typeof h === 'string' && h.length > 0)
      const sector = dna.identity?.sector

      let culturalScore: WorkflowSidebarBrandDNA['culturalScore']
      if (sector && colors.length > 0) {
        const result = scoreCulturalCoherenceFromHex({ sector, hexColors: colors })
        // N'afficher un score que s'il repose sur de vraies règles Causse (sinon = neutre non significatif).
        if (result.hasRules) {
          culturalScore = { score: result.score, level: result.level }
        }
      }

      brandDNA = {
        name,
        colors,
        platforms: dna.active_platforms ?? [],
        tone: dna.editorial_tone?.register,
        culturalScore,
      }
    }
  }

  // ── Historique réel : posts récents du tenant ──
  const { data: postsData } = await supabase
    .from('posts')
    .select('id, title, content, platforms, status, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(5)

  const history: WorkflowSidebarHistoryItem[] = (postsData ?? []).map((p) => {
    const platforms = Array.isArray(p.platforms) ? p.platforms : []
    const title = (typeof p.title === 'string' && p.title.trim().length > 0)
      ? p.title.trim()
      : (typeof p.content === 'string' ? p.content.slice(0, 60) : '')
    return {
      id: p.id,
      title,
      platform: platforms.length > 0 ? String(platforms[0]) : '',
      status: p.status,
      createdAt: p.created_at,
    }
  })

  return { brandDNA, history }
}
