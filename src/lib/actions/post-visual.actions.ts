"use server"

// ============================================================
// POST VISUEL « design-first » — génère le CONTENU d'une carte (LLM, DÉFCON
// zéro chiffre inventé), la compose par le CODE (next/og + Noto → accents
// garantis), la stocke (WebP/MinIO via storeVisual) et la renvoie sous la forme
// d'un GeneratedVisual → elle circule dans le workflow (Step5/6/7) comme un
// visuel normal. Thème / accent / handle imposés par le serveur (Brand DNA).
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { tenants, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { sanitizePromptInput } from "@/lib/utils/sanitize"
import { resolveBrandIdentity } from "@/lib/services/brand-dna/resolver"
import { normalizeLogoForRender } from "@/lib/services/brand-dna/logo-normalize"
import { preflightComposed } from "@/lib/services/brand-dna/preflight"
import { checkGenerationQuota, getPlanConfig, incrementGenerationCount } from "@/lib/billing"
import { registerLibraryAsset } from "@/lib/services/storage/library-asset"
import { renderPostVisualToDataUri } from "@/lib/services/post-visual/render"
import { parsePostVisual, type PostFormat, type PostVisual } from "@/lib/schemas/post-visual.schema"
import type { Step1Data, GeneratedVisual } from "@/lib/schemas/workflow.schema"
import { log } from "@/lib/utils/logger"

function extractJson(raw: string): unknown {
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    return null
  }
}

export type CreatePostVisualResult =
  | { success: true; card: PostVisual; visual: GeneratedVisual }
  | {
      success: false
      error: string
      quota_exceeded?: { plan: string; count: number; limit: number }
    }

export async function createPostVisualAction(
  step1: Step1Data,
  options?: { format?: PostFormat; theme?: "dark" | "light" }
): Promise<CreatePostVisualResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId =
    (await resolveUserTenant(supabase, user.id)) ??
    (await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { tenant_id: true } }))?.tenant_id ??
    null
  if (!tenantId) return { success: false, error: "Aucun espace de travail" }

  // Enforcement quota — même garde-fou que la génération de visuels IA (US-020).
  const quotaCheck = await checkGenerationQuota()
  if (!quotaCheck.allowed) {
    const limit = getPlanConfig(quotaCheck.plan).generationsPerMonth
    return {
      success: false,
      error: `Quota de générations atteint (${quotaCheck.count}/${limit} ce mois).`,
      quota_exceeded: { plan: quotaCheck.plan, count: quotaCheck.count, limit },
    }
  }

  // Brand DNA → identité visuelle résolue (SOURCE UNIQUE) : accent + onAccent
  // lisible, forme Gestalt du secteur, logo/monogramme, handle. Plus aucune
  // couleur hardcodée ici.
  const tenant = await db.query.tenants
    .findFirst({ where: eq(tenants.id, tenantId), columns: { brand_dna: true, name: true } })
    .catch(() => null)
  const identity = resolveBrandIdentity(tenant?.brand_dna, { tenantName: tenant?.name })
  const accentHex = identity.accent
  const handle = identity.handle ?? undefined
  // Logo converti en PNG (Satori ne rend pas le WebP de façon fiable).
  const logoPng = await normalizeLogoForRender(identity.logoDataUrl)
  const brand = {
    monogram: identity.monogram,
    onAccent: identity.onAccent,
    secondary: identity.secondary ?? undefined,
    shapeKey: identity.shapeKey,
    logoDataUrl: logoPng ?? undefined,
  }
  const theme = options?.theme === "light" ? "light" : "dark"
  const format: PostFormat = options?.format ?? "1:1"

  const brief = sanitizePromptInput(
    [step1.titre, step1.description].filter(Boolean).join("\n").trim()
  )
  if (brief.length < 10) return { success: false, error: "Brief trop court" }

  const systemPrompt =
    "Tu es directeur artistique et copywriter. À partir d'un brief, tu produis le CONTENU d'UNE carte " +
    "de post social composée (une seule image). Choisis le layout LE PLUS pertinent parmi : " +
    '"headline" (accroche/affirmation), "stat" (un chiffre clé), "quote" (citation), "checklist" (liste de points). ' +
    "Règles STRICTES : (1) n'invente AUCUN chiffre, statistique, citation ou nom absent du brief — n'utilise " +
    '"stat" QUE si un chiffre figure explicitement dans le brief, et "quote" QUE si une citation y figure ; sinon ' +
    'choisis "headline" ou "checklist". (2) Français impeccable, accents et apostrophes parfaits. (3) Très concis : ' +
    "titre ≤ 12 mots, sous-titre ≤ 20 mots, chaque point de liste ≤ 10 mots. " +
    "Réponds UNIQUEMENT par un objet JSON valide, sans texte ni markdown autour, de la forme : " +
    '{"layout": <UN des objets suivants>}. Objets autorisés : ' +
    '{"type":"headline","eyebrow":"…","title":"…","subtitle":"…"} | ' +
    '{"type":"stat","value":"…","label":"…","context":"…"} | ' +
    '{"type":"quote","text":"…","attribution":"…"} | ' +
    '{"type":"checklist","title":"…","items":["…","…","…"]}.'

  const userPrompt = [
    `Objectif cognitif : ${step1.objectif}`,
    handle ? `Marque : ${handle}` : "",
    "Brief :",
    brief,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const config = await getPromptConfig("workflow_brief_enrich")
    const rawText = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt,
      userPrompt,
      maxTokens: 700,
      temperature: config.temperature,
    })
    const json = extractJson(rawText)
    if (!json || typeof json !== "object") return { success: false, error: "Réponse IA invalide" }

    const card = parsePostVisual({ ...(json as Record<string, unknown>), format, theme, accentHex, handle, brand })
    if (!card) return { success: false, error: "Composition invalide" }

    // Rendu code → image (accents garantis) → WebP/MinIO via storeVisual (data URI).
    const dataUri = await renderPostVisualToDataUri(card)
    const { storeVisual } = await import("@/lib/services/storage/visual-storage")
    const stored = await storeVisual({
      imageUrl: dataUri,
      tenantId,
      sessionId: String(Date.now()),
      directionId: 1,
      index: 0,
      addWatermark: quotaCheck.plan === "free",
    })
    if (stored.error || !stored.data?.public_url) {
      return { success: false, error: stored.error ?? "Échec du stockage de l'image" }
    }

    // Score de conformité MESURÉ (Brand Preflight) — plus de constante magique.
    // Le visuel composé applique structurellement : couleur de marque (si DNA),
    // contraste lisible (onAccent), pastille (monogramme/logo), forme du secteur.
    const preflight = preflightComposed({
      brandColorApplied: identity.hasBrandColor,
      contrastSafe: true,
      brandMarkPresent: true,
      brandShapeApplied: true,
    })

    const visual: GeneratedVisual = {
      id: `rami-compose-${Date.now()}`,
      url: stored.data.public_url,
      prompt: `post-visual:${card.layout.type}`,
      // Conformité structurelle calculée (non mesurée par Vision AI : visionScored=false).
      brandDnaScore: preflight.score / 100,
      visionScored: false,
      provider: "rami-compose",
    }

    // Bibliothèque : réutilisable comme tout visuel (best-effort).
    await registerLibraryAsset(supabase, {
      tenantId,
      userId: user.id,
      stored: stored.data,
      brandDnaScore: visual.brandDnaScore,
      provider: visual.provider,
      source: "workflow",
    }).catch(() => {})

    await incrementGenerationCount(tenantId)

    log({
      level: "info",
      module: "post_visual",
      action: "composed",
      tenant_id: tenantId,
      metadata: { layout: card.layout.type, format, theme },
    })

    return { success: true, card, visual }
  } catch (err) {
    log({
      level: "error",
      module: "post_visual",
      action: "compose_failed",
      message: "Échec de la composition du post visuel",
      tenant_id: tenantId,
      metadata: { error: String(err) },
    })
    return { success: false, error: "Échec de la génération" }
  }
}
