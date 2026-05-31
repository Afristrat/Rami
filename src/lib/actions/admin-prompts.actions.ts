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
  user_message_template: string | null
  output_format: string | null
  provider: string
  model: string
  has_byok_key: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AiProviderChain = {
  id: string
  category: string
  priority: number
  provider: string
  model: string
  is_active: boolean
  has_byok_key: boolean
  updated_at: string
}

export type GetPromptsResult   = { data: AiPromptConfig[] } | { error: string }
export type GetChainsResult    = { data: AiProviderChain[] } | { error: string }
export type SavePromptResult   = { success: true; id: string } | { error: string }
export type SaveChainResult    = { success: true } | { error: string }
export type DeletePromptResult = { success: true } | { error: string }
export type TestPromptResult   =
  | { success: true; response: string; latencyMs: number }
  | { error: string }

// ── Validation schemas ────────────────────────────────────────────────────────

const promptSchema = z.object({
  field_key: z
    .string().min(1, "Requis").max(100)
    .regex(/^[a-z0-9_]+$/, "Lettres minuscules, chiffres et _ uniquement"),
  description:             z.string().max(500).optional(),
  system_prompt:           z.string().min(10, "Minimum 10 caractères").max(20_000),
  user_message_template:   z.string().max(5_000).optional(),
  output_format:           z.string().max(5_000).optional(),
  provider:                z.string().min(1, "Requis").max(50),
  model:                   z.string().min(1, "Requis").max(200),
  api_key_byok:            z.string().max(500).optional(),
  clear_byok_key:          z.boolean().optional(),
  is_active:               z.boolean(),
})

export type PromptFormData = z.infer<typeof promptSchema>

const chainEntrySchema = z.object({
  id:       z.string().uuid().optional(),
  category: z.string().min(1).max(50),
  priority: z.number().int().min(1).max(10),
  provider: z.string().min(1).max(50),
  model:    z.string().min(1).max(200),
  is_active: z.boolean(),
  api_key_byok:    z.string().max(500).optional(),
  clear_byok_key:  z.boolean().optional(),
})

export type ChainEntryFormData = z.infer<typeof chainEntrySchema>

// ── Helper : vérification super_admin ────────────────────────────────────────

async function assertSuperAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return "Non authentifié"

  // 1. JWT app_metadata (pas de requête DB)
  if (user.app_metadata?.role === "super_admin") return null

  // 2. profiles.global_role
  const { data: profile } = await supabase
    .from("profiles").select("global_role").eq("id", user.id).single()
  if (profile?.global_role === "super_admin") return null

  // 3. Fallback : users.role (table Drizzle)
  const { data: dbUser } = await supabase
    .from("users").select("role").eq("id", user.id).single()
  if (dbUser?.role === "super_admin") return null

  return "Accès refusé — rôle super_admin requis"
}

// ── Prompts Actions ───────────────────────────────────────────────────────────

export async function getPromptsAction(): Promise<GetPromptsResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ai_prompts_config")
    .select("id, field_key, description, system_prompt, user_message_template, output_format, provider, model, api_key_encrypted, is_active, created_at, updated_at")
    .order("field_key")

  if (error) return { error: "Impossible de charger les configs : " + error.message }

  const configs: AiPromptConfig[] = (data ?? []).map((row) => ({
    id:                    row.id as string,
    field_key:             row.field_key as string,
    description:           row.description as string | null,
    system_prompt:         row.system_prompt as string,
    user_message_template: row.user_message_template as string | null,
    output_format:         row.output_format as string | null,
    provider:              row.provider as string,
    model:                 row.model as string,
    has_byok_key:          !!(row.api_key_encrypted as string | null),
    is_active:             row.is_active as boolean,
    created_at:            row.created_at as string,
    updated_at:            row.updated_at as string,
  }))

  return { data: configs }
}

export async function savePromptAction(
  id: string | null,
  formData: PromptFormData
): Promise<SavePromptResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const parsed = promptSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" }

  const { api_key_byok, clear_byok_key, ...rest } = parsed.data

  let api_key_encrypted: string | null | undefined = undefined
  if (clear_byok_key) {
    api_key_encrypted = null
  } else if (api_key_byok) {
    try { api_key_encrypted = encryptToken(api_key_byok) }
    catch { return { error: "Erreur chiffrement clé BYOK" } }
  }

  const supabase = createServiceClient()

  const payload = {
    field_key:             rest.field_key,
    description:           rest.description ?? null,
    system_prompt:         rest.system_prompt,
    user_message_template: rest.user_message_template ?? null,
    output_format:         rest.output_format ?? null,
    provider:              rest.provider,
    model:                 rest.model,
    is_active:             rest.is_active,
    ...(api_key_encrypted !== undefined ? { api_key_encrypted } : {}),
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase.from("ai_prompts_config").update(payload).eq("id", id)
    if (error) return { error: "Erreur mise à jour : " + error.message }
    return { success: true, id }
  } else {
    const { data, error } = await supabase
      .from("ai_prompts_config").insert({ ...payload, created_at: new Date().toISOString() })
      .select("id").single()
    if (error) return { error: "Erreur création : " + error.message }
    return { success: true, id: (data as { id: string }).id }
  }
}

export async function deletePromptAction(id: string): Promise<DeletePromptResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const supabase = createServiceClient()
  const { error } = await supabase.from("ai_prompts_config").delete().eq("id", id)
  if (error) return { error: "Erreur suppression : " + error.message }
  return { success: true }
}

export async function testPromptAction(id: string): Promise<TestPromptResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const supabase = createServiceClient()
  const { data: row, error: fetchError } = await supabase
    .from("ai_prompts_config")
    .select("system_prompt, provider, model, api_key_encrypted")
    .eq("id", id).single()

  if (fetchError || !row) return { error: "Config introuvable" }

  let apiKey: string | undefined
  if (row.api_key_encrypted as string | null) {
    try { apiKey = decryptToken(row.api_key_encrypted as string) }
    catch { return { error: "Impossible de déchiffrer la clé BYOK" } }
  } else {
    apiKey = resolveEnvApiKey(row.provider as string)
  }

  if (!apiKey) {
    return { error: `Clé API manquante pour "${row.provider as string}". Configurez BYOK ou la variable d'environnement.` }
  }

  const start = Date.now()
  try {
    const response = await callProvider({
      provider: row.provider as string,
      model: row.model as string,
      systemPrompt: row.system_prompt as string,
      userMessage: "Réponds en une phrase : quel est ton rôle ?",
      apiKey,
    })
    return { success: true, response, latencyMs: Date.now() - start }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur inconnue" }
  }
}

// ── Provider Chains Actions ───────────────────────────────────────────────────

export async function getChainsAction(): Promise<GetChainsResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("ai_provider_chains")
    .select("id, category, priority, provider, model, is_active, api_key_encrypted, updated_at")
    .order("category").order("priority")

  if (error) {
    // Table can be absent (migration not applied yet) — return empty
    if (error.code === "42P01") return { data: [] }
    return { error: "Impossible de charger les chaînes : " + error.message }
  }

  const chains: AiProviderChain[] = (data ?? []).map((row) => ({
    id:          row.id as string,
    category:    row.category as string,
    priority:    row.priority as number,
    provider:    row.provider as string,
    model:       row.model as string,
    is_active:   row.is_active as boolean,
    has_byok_key: !!(row.api_key_encrypted as string | null),
    updated_at:  row.updated_at as string,
  }))

  return { data: chains }
}

export async function saveChainEntryAction(formData: ChainEntryFormData): Promise<SaveChainResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const parsed = chainEntrySchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" }

  const { api_key_byok, clear_byok_key, ...rest } = parsed.data

  let api_key_encrypted: string | null | undefined = undefined
  if (clear_byok_key) {
    api_key_encrypted = null
  } else if (api_key_byok) {
    try { api_key_encrypted = encryptToken(api_key_byok) }
    catch { return { error: "Erreur chiffrement" } }
  }

  const supabase = createServiceClient()

  const payload = {
    category:  rest.category,
    priority:  rest.priority,
    provider:  rest.provider,
    model:     rest.model,
    is_active: rest.is_active,
    ...(api_key_encrypted !== undefined ? { api_key_encrypted } : {}),
    updated_at: new Date().toISOString(),
  }

  if (rest.id) {
    const { error } = await supabase.from("ai_provider_chains").update(payload).eq("id", rest.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from("ai_provider_chains")
      .upsert({ ...payload, created_at: new Date().toISOString() }, { onConflict: "category,priority" })
    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function saveCategoryChainAction(
  category: string,
  entries: ChainEntryFormData[]
): Promise<SaveChainResult> {
  const authError = await assertSuperAdmin()
  if (authError) return { error: authError }

  const supabase = createServiceClient()

  // Supprimer les entrées existantes pour cette catégorie et réinsérer
  const { error: deleteError } = await supabase
    .from("ai_provider_chains").delete().eq("category", category)
  if (deleteError) return { error: "Erreur suppression : " + deleteError.message }

  if (entries.length === 0) return { success: true }

  const rows = entries.map((e, i) => {
    const { api_key_byok, clear_byok_key, id: _, ...rest } = e
    let api_key_encrypted: string | null = null
    if (!clear_byok_key && api_key_byok) {
      try { api_key_encrypted = encryptToken(api_key_byok) } catch { /* skip */ }
    }
    return {
      category:  rest.category,
      priority:  i + 1,
      provider:  rest.provider,
      model:     rest.model,
      is_active: rest.is_active,
      api_key_encrypted,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  })

  const { error: insertError } = await supabase.from("ai_provider_chains").insert(rows)
  if (insertError) return { error: "Erreur insertion : " + insertError.message }

  return { success: true }
}

// ── Helpers privés ────────────────────────────────────────────────────────────

function resolveEnvApiKey(provider: string): string | undefined {
  switch (provider) {
    case "anthropic":    return process.env.ANTHROPIC_API_KEY
    case "openai":       return process.env.OPENAI_API_KEY
    case "openrouter":   return process.env.OPENROUTER_API_KEY
    case "perplexity":   return process.env.PERPLEXITY_API_KEY
    case "moonshot":     return process.env.MOONSHOT_API_KEY
    case "mistral":      return process.env.MISTRAL_API_KEY
    default:             return undefined
  }
}

async function callProvider(opts: {
  provider: string; model: string; systemPrompt: string
  userMessage: string; apiKey: string
}): Promise<string> {
  const { provider, model, systemPrompt, userMessage, apiKey } = opts

  if (provider === "anthropic") {
    const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 256, system: systemPrompt, messages: [{ role: "user", content: userMessage }] }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) throw new Error(`Anthropic ${res.status}`)
    const json = await res.json() as { content?: Array<{ text?: string }> }
    return json.content?.[0]?.text ?? "(vide)"
  }

  const baseUrl = provider === "perplexity" ? "https://api.perplexity.ai"
    : provider === "openrouter" ? "https://openrouter.ai/api/v1"
    : provider === "moonshot" ? "https://api.moonshot.ai/v1"
    : provider === "mistral" ? "https://api.mistral.ai/v1"
    : "https://api.openai.com/v1"

  // Moonshot kimi-k2.5 n'accepte que temperature=1 — omettre le paramètre pour ces modèles
  const temperatureParam = provider === "moonshot" && model.startsWith("kimi-k2")
    ? {}
    : { temperature: 0.3 }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }], max_tokens: 256, ...temperatureParam }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`${provider} ${res.status}${body ? ` — ${body.slice(0, 200)}` : ""}`)
  }
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.[0]?.message?.content ?? "(vide)"
}
