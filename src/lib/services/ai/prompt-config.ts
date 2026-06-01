"use server"

/**
 * RAMI — Utilitaire de chargement des configurations de prompts IA
 *
 * Charge depuis la table `ai_prompts_config` :
 *   { system_prompt, provider, model, api_key_encrypted }
 *
 * Résolution de la clé API (par ordre de priorité) :
 *   1. BYOK chiffré AES-256 en DB → déchiffrement via decryptToken
 *   2. Variable d'environnement correspondante au provider
 *
 * Fallback : configs hardcodées dans FALLBACK_CONFIGS si la DB est indisponible.
 * Les modèles dans FALLBACK_CONFIGS sont les seuls modèles acceptés hors DB —
 * ils ne doivent JAMAIS être dupliqués dans les sites d'appel.
 */

import { createServiceClient } from "@/lib/supabase/service"
import { decryptToken } from "@/lib/services/oauth/state"

export type PromptProvider = "anthropic" | "openai" | "openrouter" | "perplexity" | "moonshot" | "google"

export type PromptConfig = {
  fieldKey: string
  systemPrompt: string
  /** Template du message utilisateur avec placeholders {{variable}}. Null = le code construit le message lui-même. */
  userMessageTemplate: string | null
  provider: PromptProvider
  model: string
  apiKey: string | undefined
  /** Température recommandée pour cet usage. 0.2 = factuel, 0.5 = équilibré, 0.8+ = créatif */
  temperature: number
}

/* ─── Fallback configs ───────────────────────────────────────────────────────
 * Utilisées uniquement si la table ai_prompts_config est inaccessible.
 * Les modèles et providers ici font autorité pour les appels sans DB.
 * Ne JAMAIS copier ces valeurs dans les sites d'appel.
 * ─────────────────────────────────────────────────────────────────────────── */

const FALLBACK_CONFIGS: Record<string, Omit<PromptConfig, "apiKey" | "userMessageTemplate">> = {
  // ── CRÉATIF PUR (temp 0.9) — taglines, slogans, jeux de mots ─────────────
  brand_dna_generate_tagline: {
    fieldKey: "brand_dna_generate_tagline",
    systemPrompt:
      "Tu es un expert en branding pour les marchés africains et MENA. Génère une tagline percutante. Retourne UNIQUEMENT la tagline, sans guillemets ni explication.",
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.9,
  },
  brand_dna_improve_tagline: {
    fieldKey: "brand_dna_improve_tagline",
    systemPrompt:
      "Tu es un expert en branding. Améliore la tagline fournie pour la rendre plus impactante. Retourne UNIQUEMENT la tagline améliorée, sans guillemets ni explication.",
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.9,
  },

  // ── CRÉATIF ÉDITORIAL (temp 0.8) — captions, posts, hooks ────────────────
  workflow_caption_generation: {
    fieldKey: "workflow_caption_generation",
    systemPrompt:
      'Tu es un expert en content marketing et copywriting multiplateforme. Génère des captions optimisées pour chaque réseau social. Réponds UNIQUEMENT en JSON valide : {"captions": [{"platform": "string", "hook": "string", "caption": "string", "hashtags": ["string"]}]}',
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.8,
  },

  // ── CRÉATIF TECHNIQUE (temp 0.85) — prompts image IA ─────────────────────
  visual_prompt_compiler: {
    fieldKey: "visual_prompt_compiler",
    systemPrompt:
      "Tu es un directeur artistique expert en génération d'images par IA. Génère des prompts optimisés pour FLUX.1 basés sur le Brand DNA. Retourne UNIQUEMENT un objet JSON valide.",
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.85,
  },

  // ── STRATÉGIQUE CRÉATIF (temp 0.7) — positionnement, différenciation ─────
  brand_dna_generate_positioning: {
    fieldKey: "brand_dna_generate_positioning",
    systemPrompt:
      "Tu es un stratège en branding spécialisé dans les marchés africains et MENA. Génère un positionnement unique et différenciant. Retourne UNIQUEMENT le texte du positionnement, sans explication.",
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.7,
  },
  brand_dna_improve_positioning: {
    fieldKey: "brand_dna_improve_positioning",
    systemPrompt:
      "Tu es un stratège en branding. Améliore le positionnement fourni pour le rendre plus différenciant. Retourne UNIQUEMENT le positionnement amélioré, sans explication.",
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.7,
  },

  // ── STRUCTURÉ FACTUEL (temp 0.3) — extraction JSON, profils ──────────────
  brand_dna_prefill_identite: {
    fieldKey: "brand_dna_prefill_identite",
    systemPrompt:
      'Tu es un expert en branding stratégique spécialisé dans les marchés africains et MENA. Génère une tagline et un positionnement cohérents. Retourne UNIQUEMENT un objet JSON valide : {"tagline": "string", "positioning": "string"}',
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.3,
  },
  brand_dna_prefill_audience: {
    fieldKey: "brand_dna_prefill_audience",
    systemPrompt:
      "Tu es un expert en marketing pour les marchés africains et MENA. Génère un profil d'audience précis. Retourne UNIQUEMENT un objet JSON valide : {\"audienceDescription\": \"string\", \"audienceAge\": \"string\", \"audienceLocation\": \"string\", \"audiencePainPoints\": \"string\"}",
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.3,
  },

  // ── CLASSIFICATION (temp 0.2) — choix binaire, scoring ───────────────────
  brand_dna_prefill_style: {
    fieldKey: "brand_dna_prefill_style",
    systemPrompt:
      'Tu es un expert en stratégie éditoriale. Identifie le ton de voix optimal parmi : expert, bienveillant, inspirant, ludique, premium, direct. Retourne UNIQUEMENT un objet JSON valide : {"voiceTone": "id_du_ton"}',
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.2,
  },
  visual_brand_dna_scoring: {
    fieldKey: "visual_brand_dna_scoring",
    systemPrompt:
      'Tu es un expert en cohérence de marque visuelle. Évalue l\'alignement d\'un visuel avec le Brand DNA. Retourne UNIQUEMENT un objet JSON valide : {"score_global": number, "accept": boolean, "feedback": "string"}',
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.2,
  },
  leads_brand_dna_scoring: {
    fieldKey: "leads_brand_dna_scoring",
    systemPrompt:
      'Tu es un analyste B2B expert en qualification de leads pour les marchés africains et MENA. Évalue la correspondance d\'un prospect avec le client idéal d\'une marque sur 3 axes (0-100) : audience, sector, culture. Réponds UNIQUEMENT par un objet JSON valide : {"audience": number, "sector": number, "culture": number}',
    provider: "openai",
    model: "deepseek-v4-flash",
    temperature: 0.2,
  },

  // ── FACTUALITÉ PURE (temp 0.2) — recherche, données marché ───────────────
  perplexity_sector_benchmark: {
    fieldKey: "perplexity_sector_benchmark",
    systemPrompt:
      "Tu es un analyste senior en marketing digital spécialisé dans les marchés africains et MENA. Fournis des analyses basées sur des données récentes. Réponds UNIQUEMENT en JSON valide, sans markdown.",
    provider: "perplexity",
    model: "sonar",
    temperature: 0.2,
  },
}

/* ─── Résolution de la clé API depuis les variables d'environnement ──────── */

function resolveEnvApiKey(provider: PromptProvider): string | undefined {
  switch (provider) {
    case "anthropic":  return process.env.ANTHROPIC_API_KEY
    case "openai":     return process.env.OPENAI_API_KEY
    case "openrouter": return process.env.OPENROUTER_API_KEY
    case "perplexity": return process.env.PERPLEXITY_API_KEY
    case "moonshot":   return process.env.MOONSHOT_API_KEY
    case "google":     return process.env.GOOGLE_AI_API_KEY
  }
}

/* ─── Chargement depuis la DB avec fallback ──────────────────────────────── */

/**
 * Charge la configuration d'un prompt IA depuis la table `ai_prompts_config`.
 * Fallback sur FALLBACK_CONFIGS si la DB est indisponible ou le champ absent.
 * La clé API est résolue : BYOK déchiffrée > variable d'environnement.
 *
 * @param fieldKey - Identifiant unique du prompt (ex. "brand_dna_generate_tagline")
 * @returns PromptConfig complète avec systemPrompt, provider, model, apiKey
 */
export async function getPromptConfig(fieldKey: string): Promise<PromptConfig> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("ai_prompts_config")
      .select("system_prompt, user_message_template, provider, model, api_key_encrypted, is_active")
      .eq("field_key", fieldKey)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return buildFallback(fieldKey)
    }

    const provider = data.provider as PromptProvider
    let apiKey: string | undefined

    if (data.api_key_encrypted) {
      try {
        apiKey = decryptToken(data.api_key_encrypted as string)
      } catch {
        // Échec du déchiffrement → fallback sur la variable d'environnement
        apiKey = resolveEnvApiKey(provider)
      }
    } else {
      apiKey = resolveEnvApiKey(provider)
    }

    // Température : utiliser la valeur du fallback si disponible, sinon 0.5 par défaut
    const fallbackTemp = FALLBACK_CONFIGS[fieldKey]?.temperature ?? 0.5

    return {
      fieldKey,
      systemPrompt: data.system_prompt as string,
      userMessageTemplate: (data.user_message_template as string | null) ?? null,
      provider,
      model: data.model as string,
      apiKey,
      temperature: fallbackTemp,
    }
  } catch {
    // DB inaccessible → fallback silencieux
    return buildFallback(fieldKey)
  }
}

/* ─── Construction du fallback ───────────────────────────────────────────── */

function buildFallback(fieldKey: string): PromptConfig {
  const fallback = FALLBACK_CONFIGS[fieldKey]

  if (!fallback) {
    // field_key inconnu → fallback générique texte (proxy OpenAI-compatible)
    return {
      fieldKey,
      systemPrompt: "Tu es un assistant IA expert. Réponds de manière concise et précise.",
      userMessageTemplate: null,
      provider: "openai",
      model: "deepseek-v4-flash",
      apiKey: process.env.OPENAI_API_KEY,
      temperature: 0.5,
    }
  }

  return {
    ...fallback,
    userMessageTemplate: null,
    apiKey: resolveEnvApiKey(fallback.provider),
  }
}
