"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { encryptToken, decryptToken } from "@/lib/services/oauth/state"
import { z } from "zod"

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiPromptConfig = {
  id: string
  field_key: string
  description: string | null
  system_prompt: string
  provider: string
  model: string
  /** true si une clé BYOK est configurée (la clé réelle n'est jamais exposée) */
  has_byok_key: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type GetPromptsResult =
  | { data: AiPromptConfig[] }
  | { error: string }

export type SavePromptResult =
  | { success: true; id: string }
  | { error: string }

export type DeletePromptResult =
  | { success: true }
  | { error: string }

export type TestPromptResult =
  | { success: true; response: string; latencyMs: number }
  | { error: string }

// ── Validation schemas ────────────────────────────────────────────────────────

const promptSchema = z.object({
  field_key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Uniquement lettres minuscules, chiffres et underscores"),
  description: z.string().max(500).optional(),
  system_prompt: z.string().min(10, "Le prompt système doit faire au moins 10 caractères").max(10_000),
  provider: z.enum(["anthropic", "openai", "openrouter", "perplexity"]),
  model: z.string().min(1).max(100),
  api_key_byok: z.string().max(500).optional(), // clé BYOK en clair (non stockée tel quel)
  clear_byok_key: z.boolean().optional(), // true = supprimer la clé BYOK existante
  is_active: z.boolean(),
})

export type PromptFormData = z.infer<typeof promptSchema>

// ── Helper : vérification super_admin ────────────────────────────────────────

async function assertSuperAdmin(): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return "Non authentifié"

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (profileError || profile?.role !== "super_admin") {
    return "Accès refusé — rôle super_admin requis"
  }

  return null // OK
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Récupère toutes les configs prompts (super_admin only).
 * La clé BYOK n'est jamais retournée — on retourne uniquement un flag `has_byok_key`.
 */
export async function getPromptsAction(): Promise<GetPromptsResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ai_prompts_config")
    .select("id, field_key, description, system_prompt, provider, model, api_key_encrypted, is_active, created_at, updated_at")
    .order("field_key")

  if (error) {
    return { error: "Impossible de charger les configs : " + error.message }
  }

  const configs: AiPromptConfig[] = (data ?? []).map((row) => ({
    id: row.id as string,
    field_key: row.field_key as string,
    description: row.description as string | null,
    system_prompt: row.system_prompt as string,
    provider: row.provider as string,
    model: row.model as string,
    has_byok_key: !!(row.api_key_encrypted as string | null),
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))

  return { data: configs }
}

/**
 * Crée ou met à jour une config prompt.
 * Si api_key_byok est fournie, elle est chiffrée AES-256-GCM avant stockage.
 */
export async function savePromptAction(
  id: string | null,
  formData: PromptFormData
): Promise<SavePromptResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const parsed = promptSchema.safeParse(formData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message ?? "Données invalides" }
  }

  const { api_key_byok, clear_byok_key, ...rest } = parsed.data

  // Chiffrement de la clé BYOK si fournie
  let api_key_encrypted: string | null | undefined = undefined

  if (clear_byok_key) {
    api_key_encrypted = null
  } else if (api_key_byok) {
    try {
      api_key_encrypted = encryptToken(api_key_byok)
    } catch {
      return { error: "Erreur lors du chiffrement de la clé API BYOK" }
    }
  }

  // Utiliser le service client pour bypass RLS (on a déjà validé le rôle)
  const supabase = createServiceClient()

  const payload = {
    field_key: rest.field_key,
    description: rest.description ?? null,
    system_prompt: rest.system_prompt,
    provider: rest.provider,
    model: rest.model,
    is_active: rest.is_active,
    ...(api_key_encrypted !== undefined ? { api_key_encrypted } : {}),
    updated_at: new Date().toISOString(),
  }

  if (id) {
    // Mise à jour
    const { error } = await supabase
      .from("ai_prompts_config")
      .update(payload)
      .eq("id", id)

    if (error) return { error: "Erreur mise à jour : " + error.message }
    return { success: true, id }
  } else {
    // Création
    const { data, error } = await supabase
      .from("ai_prompts_config")
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select("id")
      .single()

    if (error) return { error: "Erreur création : " + error.message }
    return { success: true, id: (data as { id: string }).id }
  }
}

/**
 * Supprime une config prompt.
 */
export async function deletePromptAction(id: string): Promise<DeletePromptResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from("ai_prompts_config")
    .delete()
    .eq("id", id)

  if (error) return { error: "Erreur suppression : " + error.message }
  return { success: true }
}

/**
 * Teste un prompt en l'envoyant au provider configuré avec un message de test standard.
 * La clé BYOK (si configurée) est déchiffrée pour l'appel puis oubliée.
 */
export async function testPromptAction(id: string): Promise<TestPromptResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const supabase = createServiceClient()

  const { data: row, error: fetchError } = await supabase
    .from("ai_prompts_config")
    .select("system_prompt, provider, model, api_key_encrypted")
    .eq("id", id)
    .single()

  if (fetchError || !row) {
    return { error: "Config introuvable" }
  }

  // Résoudre la clé API : BYOK déchiffrée > variable d'environnement
  let apiKey: string | undefined

  if (row.api_key_encrypted as string | null) {
    try {
      apiKey = decryptToken(row.api_key_encrypted as string)
    } catch {
      return { error: "Impossible de déchiffrer la clé BYOK" }
    }
  } else {
    apiKey = resolveEnvApiKey(row.provider as string)
  }

  if (!apiKey) {
    return { error: `Clé API manquante pour le provider "${row.provider as string}". Configurez BYOK ou la variable d'environnement.` }
  }

  const testMessage = "Réponds en une phrase : quel est ton rôle ?"

  const start = Date.now()

  try {
    const response = await callProvider({
      provider: row.provider as string,
      model: row.model as string,
      systemPrompt: row.system_prompt as string,
      userMessage: testMessage,
      apiKey,
    })

    return { success: true, response, latencyMs: Date.now() - start }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue lors du test" }
  }
}

// ── Helpers privés ────────────────────────────────────────────────────────────

function resolveEnvApiKey(provider: string): string | undefined {
  switch (provider) {
    case "anthropic":    return process.env.ANTHROPIC_API_KEY
    case "openai":       return process.env.OPENAI_API_KEY
    case "openrouter":   return process.env.OPENROUTER_API_KEY
    case "perplexity":   return process.env.PERPLEXITY_API_KEY
    default:             return undefined
  }
}

async function callProvider(opts: {
  provider: string
  model: string
  systemPrompt: string
  userMessage: string
  apiKey: string
}): Promise<string> {
  const { provider, model, systemPrompt, userMessage, apiKey } = opts

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) throw new Error(`Anthropic API ${res.status}`)
    const json = await res.json() as { content?: Array<{ text?: string }> }
    return json.content?.[0]?.text ?? "(réponse vide)"
  }

  if (provider === "perplexity" || provider === "openai" || provider === "openrouter") {
    const baseUrl = provider === "perplexity"
      ? "https://api.perplexity.ai"
      : provider === "openrouter"
      ? "https://openrouter.ai/api/v1"
      : "https://api.openai.com/v1"

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 256,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) throw new Error(`${provider} API ${res.status}`)
    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
    return json.choices?.[0]?.message?.content ?? "(réponse vide)"
  }

  throw new Error(`Provider non supporté : ${provider}`)
}
