"use server"

// ============================================================
// Régénération de texte guidée par presets de correction (Pilier 3).
// L'utilisateur clique des corrections prédéfinies (+ texte libre optionnel) à
// la validation ; on régénère le texte en appliquant EXACTEMENT ces corrections,
// sans inventer de faits. Ne persiste PAS — l'utilisateur relit puis enregistre.
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { sanitizePromptInput } from "@/lib/utils/sanitize"
import { buildCorrectionInstruction } from "@/lib/services/workflow/correction-presets"
import { log } from "@/lib/utils/logger"

export async function applyCorrectionPresetsAction(input: {
  postId: string
  currentContent: string
  platform?: string
  presetIds: string[]
  freeText?: string
}): Promise<{ success: true; content: string } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "no_tenant" }

  // Sécurité : le post doit appartenir à un tenant accessible au membre
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", input.postId)
    .eq("tenant_id", tenantId)
    .single()
  if (!post) return { success: false, error: "not_found" }

  const base = sanitizePromptInput(input.currentContent ?? "")
  if (base.trim().length < 3) return { success: false, error: "too_short" }

  const instruction = buildCorrectionInstruction(input.presetIds ?? [], input.freeText)
  if (!instruction) return { success: false, error: "no_correction" }

  const config = await getPromptConfig("workflow_brief_enrich")
  const platform = (input.platform ?? "").toString().slice(0, 30)
  const systemPrompt =
    "Tu es un expert en rédaction social media. On te donne le texte d'un post et des corrections à " +
    "appliquer. Applique EXACTEMENT les corrections demandées. N'invente AUCUN fait, chiffre ni promesse. " +
    "Conserve la langue d'origine et le sens. Soigne l'orthographe et tous les accents français. Pas de " +
    "markdown. Réponds UNIQUEMENT avec le texte corrigé."
  const userPrompt = [
    platform ? `Plateforme cible : ${platform}` : "",
    instruction,
    "Texte à corriger :",
    base,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt,
      userPrompt,
      maxTokens: 800,
      temperature: config.temperature,
    })
    const corrected = raw.trim().replace(/^["']|["']$/g, "").slice(0, 3000)
    if (corrected.length < 3) return { success: false, error: "empty" }
    return { success: true, content: corrected }
  } catch (err) {
    log({
      level: "error",
      module: "review",
      action: "apply_corrections_failed",
      message: "Échec de la correction IA du texte",
      metadata: { error: String(err) },
    })
    return { success: false, error: "llm_failed" }
  }
}
