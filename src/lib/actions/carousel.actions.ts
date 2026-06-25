"use server"

// ============================================================
// Génération d'un carrousel (deck de slides typées) par le LLM, à partir d'un
// brief. Sortie STRICTE en JSON conforme à carouselSchema. DÉFCON : ne jamais
// inventer de chiffre/fait absent du brief. Accents français soignés.
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { sanitizePromptInput } from "@/lib/utils/sanitize"
import { resolveBrandIdentity } from "@/lib/services/brand-dna/resolver"
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

export async function createCarouselAction(input: {
  brief: string
  slideCount?: number
  accentHex?: string
  theme?: "dark" | "light"
  handle?: string
  author?: string
}): Promise<{ success: true; carousel: Carousel } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }
  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "no_tenant" }

  const brief = sanitizePromptInput(input.brief ?? "")
  if (brief.trim().length < 10) return { success: false, error: "brief_too_short" }

  // Brand DNA → identité résolue : accent par DÉFAUT = couleur de marque (le
  // choix manuel de l'UI reste prioritaire), + monogramme/logo/forme injectés.
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("brand_dna, name")
    .eq("id", tenantId)
    .single()
  const identity = resolveBrandIdentity(tenantRow?.brand_dna ?? null, { tenantName: tenantRow?.name ?? null })

  const n = Math.max(5, Math.min(10, input.slideCount ?? 7))
  const accentHex = /^#[0-9a-fA-F]{6}$/.test(input.accentHex ?? "") ? input.accentHex : identity.accent
  const theme = input.theme === "light" ? "light" : "dark"
  const brand = {
    monogram: identity.monogram,
    onAccent: identity.onAccent,
    secondary: identity.secondary ?? undefined,
    shapeKey: identity.shapeKey,
    logoDataUrl: identity.logoDataUrl ?? undefined,
  }
  const handle = input.handle ?? identity.handle ?? undefined

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
    input.handle ? `Auteur/handle : ${sanitizePromptInput(input.handle).slice(0, 60)}` : "",
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

    // On impose les choix UI (thème/accent/handle/auteur) par-dessus la sortie LLM.
    const merged =
      typeof json === "object" && json !== null
        ? {
            ...(json as Record<string, unknown>),
            theme,
            accentHex,
            brand,
            handle: handle ?? (json as Record<string, unknown>).handle,
            author: input.author ?? (json as Record<string, unknown>).author,
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
