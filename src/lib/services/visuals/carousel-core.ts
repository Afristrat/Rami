// ============================================================
// Cœur de génération d'un carrousel (deck de slides typées) — moteur partagé.
// ------------------------------------------------------------
// Module serveur PUR (pas de 'use server') : appelable par
//   • l'action UI `createCarouselAction` (contexte tenant dérivé de la session)
//   • l'API publique v1 (contexte tenant dérivé de la clé d'API)
// Le Brand DNA brut + le nom du tenant sont fournis EXPLICITEMENT : le cœur
// n'appelle JAMAIS supabase.auth.getUser() ni resolveUserTenant. Aucune
// duplication de la logique LLM (contrainte design.md — DRY).
// DÉFCON : ne jamais inventer de chiffre/fait absent du brief.
// ============================================================

import { callTextLLM } from "@/lib/services/ai/text-llm"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { sanitizePromptInput } from "@/lib/utils/sanitize"
import { resolveBrandIdentity } from "@/lib/services/brand-dna/resolver"
import { normalizeLogoForRender } from "@/lib/services/brand-dna/logo-normalize"
import { parseCarousel, type Carousel } from "@/lib/schemas/carousel.schema"
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

export interface CarouselDeckArgs {
  /** Brand DNA brut (colonne `tenants.brand_dna`) — résolu dans le cœur. */
  brandDnaRaw: unknown
  /** Nom du tenant (pour le monogramme de repli). */
  tenantName: string | null
  brief: string
  slideCount?: number
  accentHex?: string
  theme?: "dark" | "light"
  handle?: string
  author?: string
}

export type CarouselDeckResult =
  | { success: true; carousel: Carousel }
  | { success: false; error: string }

/**
 * Génère la STRUCTURE d'un carrousel (JSON conforme à carouselSchema) à partir
 * d'un brief et d'un Brand DNA explicite. Ne réalise aucune authentification :
 * c'est la responsabilité de l'appelant (action de session ou route API).
 */
export async function generateCarouselDeck(args: CarouselDeckArgs): Promise<CarouselDeckResult> {
  const brief = sanitizePromptInput(args.brief ?? "")
  if (brief.trim().length < 10) return { success: false, error: "brief_too_short" }

  // Brand DNA → identité résolue : accent par DÉFAUT = couleur de marque (le
  // choix manuel reste prioritaire), + monogramme/logo/forme injectés.
  const identity = resolveBrandIdentity(args.brandDnaRaw ?? null, { tenantName: args.tenantName ?? null })

  const n = Math.max(5, Math.min(10, args.slideCount ?? 7))
  const accentHex = /^#[0-9a-fA-F]{6}$/.test(args.accentHex ?? "") ? args.accentHex : identity.accent
  const theme = args.theme === "light" ? "light" : "dark"
  const logoPng = await normalizeLogoForRender(identity.logoDataUrl)
  const brand = {
    monogram: identity.monogram,
    onAccent: identity.onAccent,
    secondary: identity.secondary ?? undefined,
    shapeKey: identity.shapeKey,
    logoDataUrl: logoPng ?? undefined,
  }
  const handle = args.handle ?? identity.handle ?? undefined

  const config = await getPromptConfig("workflow_brief_enrich")
  const systemPrompt =
    "Tu es directeur artistique et copywriter expert en carrousels LinkedIn. À partir d'un brief, " +
    `tu produis un carrousel de ${n} slides percutant, structuré (pyramide de Minto, MECE), au ton ` +
    "professionnel et incarné. Règles STRICTES : (1) n'invente AUCUN chiffre, fait, citation ou nom " +
    "absent du brief ; (2) français impeccable, accents et apostrophes parfaits ; (3) phrases courtes, " +
    "une idée par slide ; (4) commence par une slide `cover`, termine par une slide `cta`. " +
    "Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, sans markdown, de la forme : " +
    '{"theme":"' +
    theme +
    '","accentHex":"' +
    accentHex +
    '","handle":"…","author":"…","slides":[ … ]}. ' +
    "Types de slide autorisés (choisis les plus pertinents) : " +
    '{"type":"cover","eyebrow":"…","title":"…","subtitle":"…","author":"…"} | ' +
    '{"type":"point","index":"01","heading":"…","body":"…","bullets":["…"]} | ' +
    '{"type":"stat","value":"…","label":"…","context":"…"} | ' +
    '{"type":"quote","text":"…","attribution":"…"} | ' +
    '{"type":"comparison","leftTitle":"…","leftItems":["…"],"rightTitle":"…","rightItems":["…"]} | ' +
    '{"type":"cta","heading":"…","body":"…","action":"…"}.'
  const userPrompt = [
    args.handle ? `Auteur/handle : ${sanitizePromptInput(args.handle).slice(0, 60)}` : "",
    `Brief :`,
    brief,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const rawText = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt,
      userPrompt,
      maxTokens: 2200,
      temperature: config.temperature,
    })
    const json = extractJson(rawText)
    if (!json) return { success: false, error: "invalid_json" }

    // On impose les choix (thème/accent/handle/auteur) par-dessus la sortie LLM.
    const merged =
      typeof json === "object" && json !== null
        ? {
            ...(json as Record<string, unknown>),
            theme,
            accentHex,
            brand,
            handle: handle ?? (json as Record<string, unknown>).handle,
            author: args.author ?? (json as Record<string, unknown>).author,
          }
        : json
    const carousel = parseCarousel(merged)
    if (!carousel) return { success: false, error: "parse_failed" }
    return { success: true, carousel }
  } catch (err) {
    log({
      level: "error",
      module: "carousel",
      action: "generate_failed",
      message: "Échec de la génération du carrousel",
      metadata: { error: String(err) },
    })
    return { success: false, error: "llm_failed" }
  }
}
