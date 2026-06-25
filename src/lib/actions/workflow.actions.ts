"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sanitizePromptInput } from "@/lib/utils/sanitize"
import { log } from "@/lib/utils/logger"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { checkGenerationQuota, getPlanConfig, incrementGenerationCount } from "@/lib/billing"
import { normalizeBrandDNA } from "@/lib/services/brand-dna/normalize"
import { compileBrandDNAToPrompts, type StructuredPrompt } from "@/lib/services/brand-dna/prompt-compiler"
import { generateImage } from "@/lib/services/image-generation"
import { getStylePreset } from "@/lib/services/image-generation/style-presets"
import { scoreImageWithVision } from "@/lib/services/brand-dna/vision-scorer"
import type { Step1Data, Step2Data, GeneratedCaption, GeneratedVisual, WorkflowState } from "@/lib/schemas/workflow.schema"
import type { Platform } from "@/lib/scheduler/platform-config"
import type { NewPostData } from "@/app/actions/scheduler"
import { parseWorkflowStateEnvelope } from "@/lib/services/workflow/session-state"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { registerLibraryAsset } from "@/lib/services/storage/library-asset"

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Choisit la direction visuelle (parmi les 4 compilées) la plus alignée avec
 * l'objectif cognitif du post. Fallback sur la 1ʳᵉ direction (Blueprint/confiance).
 */
function pickDirectionForObjective(prompts: StructuredPrompt[], objective: string): StructuredPrompt {
  const byObjective: Record<string, number> = {
    confiance: 0, // Blueprint Scientifique
    urgence: 1, // Machine Narratif
    aspiration: 2, // Carte & Aspiration
    expertise: 3, // Dashboard Expertise
    communaute: 0,
    joie: 1,
    serenite: 0,
    croissance: 2,
    creativite: 1,
  }
  const idx = byObjective[objective] ?? 0
  return prompts[idx] ?? prompts[0]
}

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

// ── Action : Enrichir le brief (Step 1) ───────────────────────────────────────

export type EnrichBriefResult =
  | { success: true; description: string }
  | { success: false; error: string }

/**
 * Enrichit la description d'un brief de post via le LLM (deepseek), en tenant
 * compte du Brand DNA du tenant. Renvoie une description prête à servir de base
 * à la génération de contenu. Aucun texte inventé hors-sujet : on part du brief
 * existant.
 */
export async function enrichBriefAction(input: {
  titre: string
  description: string
  objectif?: string
  angle?: string
}): Promise<EnrichBriefResult> {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return { success: false, error: "Non authentifié." }

  const titre = sanitizePromptInput(input.titre ?? "")
  const description = sanitizePromptInput(input.description ?? "")
  if (description.trim().length < 10) {
    return { success: false, error: "Décrivez d'abord votre contenu (10 caractères minimum)." }
  }

  const tenant = await getTenantBrandDna(ctx.tenantId)
  const dna = normalizeBrandDNA(tenant?.brand_dna)
  const hasDna = Boolean(dna.identity?.name || dna.identity?.sector)
  const brandContext = hasDna
    ? `Marque : ${dna.identity?.name || tenant?.name || "—"} · Secteur : ${dna.identity?.sector || "—"} · Ton : ${dna.editorial_tone?.register || "professionnel"} · Marché : ${dna.culture_markets?.primary_culture || "—"}`
    : ""

  const config = await getPromptConfig("workflow_brief_enrich")
  const userPrompt = [
    "Enrichis le brief suivant en une description claire et actionnable (100-220 mots, français), prête pour la génération de contenu. Garde l'intention, ajoute le contexte utile, une accroche et les points clés. Ne renvoie QUE la description enrichie.",
    `Titre : ${titre}`,
    `Objectif cognitif : ${input.objectif || "non défini"}`,
    input.angle ? `Angle éditorial : ${sanitizePromptInput(input.angle)}` : "",
    `Description actuelle : ${description}`,
    brandContext,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt: config.systemPrompt,
      userPrompt,
      maxTokens: 600,
      temperature: config.temperature,
    })
    const enriched = raw.trim().replace(/^["']|["']$/g, "").slice(0, 2000)
    if (enriched.length < 10) {
      return { success: false, error: "L'enrichissement n'a rien renvoyé d'exploitable. Réessayez." }
    }
    return { success: true, description: enriched }
  } catch (err) {
    log({
      level: "error",
      module: "workflow",
      action: "enrich_brief_failed",
      tenant_id: ctx.tenantId,
      message: "Échec de l'enrichissement du brief",
      metadata: { error: String(err) },
    })
    return { success: false, error: "L'enrichissement IA a échoué. Réessayez dans un instant." }
  }
}

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
  // Normalise la shape PLATE réelle → lecture fiable du secteur/ton/objectif/marché.
  const dna = normalizeBrandDNA(tenant?.brand_dna)
  const hasDna = Boolean(dna.identity?.name || dna.identity?.sector)

  const safeDescription = sanitizePromptInput(step1.description)
  const safeCible = sanitizePromptInput(step1.cible ?? "")

  const brandContext = hasDna
    ? `
Brand DNA :
- Entreprise : ${dna.identity?.name || tenant?.name || "Non défini"}
- Secteur : ${dna.identity?.sector || "Non défini"}
- Ton éditorial : ${dna.editorial_tone?.register || "professionnel"}
- Objectif cognitif : ${dna.cognitive_objective || step1.objectif}
- Marché primaire : ${dna.culture_markets?.primary_culture || "Non défini"}
`
    : `Objectif cognitif : ${step1.objectif}\nCible : ${safeCible || "audience professionnelle"}`

  const platformsText = step2.platforms.join(", ")
  const format = step2.format

  const captionConfig = await getPromptConfig("workflow_caption_generation")

  const angleText = step1.angle
    ? `Angle éditorial à privilégier : ${sanitizePromptInput(step1.angle)}\n`
    : ""

  const userPrompt = `Génère des captions pour ce contenu :

Titre : ${step1.titre}
Description : ${safeDescription}
${angleText}${brandContext}
Plateformes cibles : ${platformsText}
Format : ${format}

Pour chaque plateforme dans [${platformsText}], génère :
{
  "captions": [
    {
      "platform": "nom_plateforme",
      "hook": "accroche percutante (max 20 mots)",
      "hookVariants": ["accroche alternative 1 (max 20 mots)", "accroche alternative 2 (max 20 mots)"],
      "caption": "texte complet du post adapté à la plateforme, commençant par le hook",
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
        hookVariants?: string[]
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
        hookVariants: Array.isArray(c.hookVariants)
          ? c.hookVariants.filter((h) => typeof h === "string" && h.trim().length > 0).slice(0, 3)
          : [],
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

// ── Action : Génération visuelle ─────────────────────────────────────────────
// Z-03 : tout le chemin de génération passe par le service unifié
//        src/lib/services/image-generation/index.ts (NanaBanana→Fal→Imagen→Replicate→Together).
//        L'ancien code direct Fal + Replicate (routes mortes /api/replicate/poll) a été supprimé.
//
// Z-01 : le score Brand DNA est calculé via scoreImageWithVision (Vision AI ou heuristique
//        de secours). Math.random() supprimé — interdit DEFCON 1.
//
// Z-02 : quand tous les providers échouent, l'action retourne une erreur structurée honnête
//        au lieu de placeholders picsum.photos.

export type GenerateVisualResult =
  | { success: true; visuals: GeneratedVisual[] }
  | {
      success: false
      error: string
      /** Présent si le quota est dépassé — le client affiche l'invite d'upgrade. */
      quota_exceeded?: { plan: string; count: number; limit: number }
    }

export async function generateVisualContentAction(
  step1: Step1Data,
  _step2: Step2Data,
  options?: { stylePresetId?: string | null }
): Promise<GenerateVisualResult> {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return { success: false, error: "Non authentifié" }

  // Enforcement quota générations (US-020) — même garde-fou que /create.
  const quotaCheck = await checkGenerationQuota()
  if (!quotaCheck.allowed) {
    const limit = getPlanConfig(quotaCheck.plan).generationsPerMonth
    return {
      success: false,
      error: `Quota de générations atteint (${quotaCheck.count}/${limit} ce mois). Passez au plan supérieur pour continuer.`,
      quota_exceeded: { plan: quotaCheck.plan, count: quotaCheck.count, limit },
    }
  }

  const tenant = await getTenantBrandDna(ctx.tenantId)
  // Normalise la shape PLATE réelle → couleurs/secteur/objectif fiables (résout IDs Causse → HEX).
  const dna = normalizeBrandDNA(tenant?.brand_dna)

  const cognitiveObjective = dna.cognitive_objective || step1.objectif
  // Couleurs cibles pour le scoring Vision AI (palette réelle du tenant).
  const targetColors: string[] =
    dna.color_palette
      ?.map((c) => c.hex)
      .filter((h): h is string => typeof h === "string" && h.length > 0)
      ?? ["#1D4ED8"]

  // UNIFICATION (anti-dette) : le workflow utilise désormais le MÊME compilateur
  // Brand DNA que la page /create — palette HEX COMPLÈTE + forme Gestalt du
  // secteur + émotion (objectif cognitif) + contexte culturel + positionnement.
  // Fini le prompt simplifié qui n'injectait que la couleur primaire (20% du DNA).
  const brief = sanitizePromptInput([step1.titre, step1.description].filter(Boolean).join(". ").trim())
  const compiled = compileBrandDNAToPrompts(dna, brief)
  const direction = pickDirectionForObjective(compiled, cognitiveObjective)

  // Preset de style sélectionné dans le Step 4 — résolu côté serveur (id inconnu → ignoré).
  const stylePreset = getStylePreset(options?.stylePresetId)
  const styleFragment = stylePreset ? `, ${stylePreset.prompt}` : ""

  const safePrompt = sanitizePromptInput(direction.positive_prompt + styleFragment)
  const negativePrompt = direction.negative_prompt

  try {
    // Z-03 : appel unique au service unifié — gère la chaîne de fallback complète.
    const result = await generateImage({
      positive_prompt: safePrompt,
      negative_prompt: negativePrompt,
      width: 1024,
      height: 1024,
      guidance_scale: 7.5,
      num_inference_steps: 28,
      num_images: 4,
    })

    // Z-01 : scorer chaque image via Vision AI (ou heuristique si OPENAI_API_KEY absent).
    // Les appels sont en parallèle pour limiter la latence totale.
    // Z-04 : uploader chaque visuel vers MinIO → URL publique courte. Évite que les
    // data URIs base64 (Nano Banana / Gemini, ~1-2 Mo) ne dépassent la limite 1 Mo
    // des Server Actions (autosave), et fournit une URL exploitable par la publication.
    const { storeVisual } = await import("@/lib/services/storage/visual-storage")
    const addWatermark = quotaCheck.plan === "free"
    const sessionTag = String(Date.now())
    // tenantId capturé hors closure (le narrowing du guard est perdu dans .map async).
    const tenantId = ctx.tenantId
    const results = await Promise.all(
      result.images.map(async (img, idx) => {
        const [visionResult, stored] = await Promise.all([
          scoreImageWithVision({
            imageUrl: img.url,
            targetColors,
            targetEmotion: cognitiveObjective,
            promptUsed: safePrompt,
          }).catch(() => ({ score: 70, vision_scored: false as const })),
          storeVisual({
            imageUrl: img.url,
            tenantId,
            sessionId: sessionTag,
            directionId: 1,
            index: idx,
            addWatermark,
          }).catch((e) => ({ data: null, error: e instanceof Error ? e.message : String(e) })),
        ])

        if (stored.error || !stored.data?.public_url) {
          log({
            level: "warn",
            module: "workflow",
            action: "visual_storage_failed",
            tenant_id: tenantId,
            metadata: { error: stored.error ?? "pas d'URL publique", index: idx },
          })
        }

        const visual: GeneratedVisual = {
          id: `${result.provider}-${Date.now()}-${idx}`,
          // URL persistée MinIO en priorité ; data URI source en secours uniquement.
          url: stored.data?.public_url ?? stored.data?.signed_url ?? img.url,
          prompt: safePrompt,
          // score Vision AI retourné sur 100 → normalisé sur 1 pour l'UI
          brandDnaScore: Math.min(1, Math.max(0, visionResult.score / 100)),
          visionScored: visionResult.vision_scored,
          provider: result.provider,
        }
        return { visual, stored: stored.data }
      })
    )
    const scored = results.map((r) => r.visual)

    // Enregistrement bibliothèque : CHAQUE visuel généré devient réutilisable
    // (fin du gaspillage). Best-effort, tenant aligné sur la lecture de la
    // bibliothèque (resolveUserTenant). N'altère jamais le résultat de génération.
    const libUserId = ctx.userId
    if (libUserId) {
      const supabase = await createClient()
      const libTenant = (await resolveUserTenant(supabase, libUserId)) ?? tenantId
      await Promise.all(
        results.map(async (r) => {
          if (!r.stored?.public_url) return
          await registerLibraryAsset(supabase, {
            tenantId: libTenant,
            userId: libUserId,
            stored: r.stored,
            brandDnaScore: r.visual.brandDnaScore,
            provider: r.visual.provider,
            source: "workflow",
          }).catch(() => {})
        })
      )
    }

    // Génération réelle → consomme un quota (US-020).
    await incrementGenerationCount(ctx.tenantId)

    log({
      level: "info",
      module: "workflow",
      action: "visuals_generated",
      tenant_id: ctx.tenantId,
      metadata: { count: scored.length, provider: result.provider, duration_ms: result.duration_ms, style_preset: stylePreset?.id ?? null },
    })

    return { success: true, visuals: scored }
  } catch (err) {
    // Z-02 : tous les providers ont échoué → erreur honnête, pas de placeholder.
    const errorMessage = err instanceof Error ? err.message : String(err)
    log({
      level: "error",
      module: "workflow",
      action: "visual_generation_all_providers_failed",
      tenant_id: ctx.tenantId,
      metadata: { error: errorMessage },
    })

    return {
      success: false,
      error: "La génération d'images a échoué (tous les providers sont indisponibles). Veuillez réessayer dans quelques instants.",
    }
  }
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
  /** Post déjà créé en amont (ex. lien d'approbation Step 6, ou édition d'un brouillon) — mis à jour au lieu d'être dupliqué. */
  existingPostId?: string | null
  /** Snapshot complet du parcours, stocké sur le post pour une réouverture riche (Option B). */
  workflowState?: WorkflowState | null
}): Promise<SaveWorkflowPostResult> {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return { success: false, error: "Non authentifié" }

  try {
    const { createPost, updatePost } = await import("@/app/actions/scheduler")

    const content = data.finalCaption
    // Le visuel sélectionné est persisté sur le post (aperçu, approbation, publication).
    const mediaUrls = data.finalVisualUrl && /^https?:\/\//.test(data.finalVisualUrl)
      ? [data.finalVisualUrl]
      : undefined

    const postData: NewPostData = {
      title: data.step1.titre,
      content,
      platforms: data.step2.platforms as NewPostData["platforms"],
      scheduled_at: data.scheduledAt,
      status: data.status,
      media_urls: mediaUrls,
    }

    const result = data.existingPostId
      ? await updatePost(data.existingPostId, postData)
      : await createPost(postData)

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

    // Snapshot complet du parcours dans le post → réouverture riche (Option B :
    // éditer/reprendre recharge captions, visuels, style — pas seulement le texte).
    if (data.workflowState && parseWorkflowStateEnvelope(data.workflowState).valid) {
      const supabase = await createClient()
      const { data: existing } = await supabase
        .from("posts")
        .select("ai_metadata")
        .eq("id", result.data.id)
        .eq("tenant_id", ctx.tenantId)
        .single<{ ai_metadata: Record<string, unknown> | null }>()
      const meta = existing?.ai_metadata ?? {}
      await supabase
        .from("posts")
        .update({ ai_metadata: { ...meta, workflow_state: data.workflowState } })
        .eq("id", result.data.id)
        .eq("tenant_id", ctx.tenantId)
    }

    // Publier depuis le workflow = action humaine explicite après aperçu (Step 5/6).
    // On pose l'approbation de publication (verrou) pour ce chemin — le Plan 3
    // remplacera l'aperçu actuel par un mockup fidèle multi-plateforme.
    if (data.status === "approved" || data.status === "scheduled") {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("posts")
          .update({ approved_by: user.id, approved_at: new Date().toISOString() })
          .eq("id", result.data.id)
          .eq("tenant_id", ctx.tenantId)
      }
    }

    // Publication RÉELLE : enfiler le job pg-boss selon le mode choisi (réutilise
    // l'action réelle `publishPost` → statut "scheduled" + enqueue, worker publie
    // ensuite via les vraies APIs LinkedIn/X/…). "draft" et "review" ne publient rien.
    if (data.status === "approved" || data.status === "scheduled") {
      const { publishPost } = await import("@/app/actions/scheduler")
      const scheduleDate =
        data.status === "scheduled" && data.scheduledAt
          ? new Date(data.scheduledAt)
          : null
      const enqueue = await publishPost(result.data.id, scheduleDate)
      if (!enqueue.success) {
        log({
          level: "error",
          module: "workflow",
          action: "post_enqueue_failed",
          tenant_id: ctx.tenantId,
          metadata: { postId: result.data.id, status: data.status, error: enqueue.error },
        })
        return { success: false, error: enqueue.error }
      }
    }

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

/**
 * Charge l'état de parcours d'un post pour le rouvrir dans « Créer un post »
 * (Option B). Retourne :
 *  1. le snapshot complet `ai_metadata.workflow_state` s'il existe (brouillon créé
 *     via le workflow → captions, visuels, style préservés) ;
 *  2. sinon un état minimal reconstruit depuis le post (titre, texte, plateformes,
 *     visuel) — pour les posts créés hors workflow ou avant cette feature.
 * Tenant-scopé ; `null` si le post est introuvable.
 */
export async function getDraftWorkflowStateAction(
  postId: string
): Promise<{ state: WorkflowState } | null> {
  const ctx = await getAuthContext()
  if (!ctx?.tenantId) return null

  const supabase = await createClient()
  const { data: post } = await supabase
    .from("posts")
    .select("title, content, platforms, media_urls, ai_metadata")
    .eq("id", postId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle<{
      title: string | null
      content: string | null
      platforms: string[] | null
      media_urls: string[] | null
      ai_metadata: Record<string, unknown> | null
    }>()

  if (!post) return null

  // 1) Snapshot complet du parcours s'il a été persisté.
  const snapshot = post.ai_metadata?.workflow_state
  if (snapshot) {
    const env = parseWorkflowStateEnvelope(snapshot)
    if (env.valid) return { state: env.state }
  }

  // 2) Fallback : reconstruire un état minimal depuis les champs du post.
  const platforms = (Array.isArray(post.platforms) ? post.platforms : []) as Platform[]
  const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : []
  const content = post.content ?? ""
  const state: WorkflowState = {
    currentStep: 1,
    step1: {
      titre: post.title ?? "",
      description: content.slice(0, 2000),
      objectif: "expertise",
      cible: "",
      angle: "",
    },
    step2: platforms.length > 0 ? { platforms, format: "post" } : null,
    step3: null,
    step4: null,
    step5: {
      finalCaption: content,
      finalHashtags: [],
      finalVisualUrl: mediaUrls[0] ?? null,
      notes: "",
    },
    step6: null,
    step7: null,
  }
  return { state }
}
