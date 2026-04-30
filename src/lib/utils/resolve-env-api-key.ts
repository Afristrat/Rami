/**
 * Map provider → variable d'environnement correspondante.
 * Jamais exposé côté client — utilisé uniquement côté serveur.
 */
export const PROVIDER_ENV_VARS: Record<string, string> = {
  anthropic:   "ANTHROPIC_API_KEY",
  openai:      "OPENAI_API_KEY",
  openrouter:  "OPENROUTER_API_KEY",
  perplexity:  "PERPLEXITY_API_KEY",
  fal_ai:      "FAL_API_KEY",
  replicate:   "REPLICATE_API_TOKEN",
  together_ai: "TOGETHER_API_KEY",
  moonshot:    "MOONSHOT_API_KEY",
  google:      "GOOGLE_AI_API_KEY",
  gemini:      "GOOGLE_AI_API_KEY",
}

/**
 * Résout la clé API d'un provider depuis les variables d'environnement.
 * À utiliser côté serveur uniquement — ne jamais appeler côté client.
 */
export function resolveEnvApiKey(provider: string): string | undefined {
  const envVar = PROVIDER_ENV_VARS[provider]
  if (!envVar) return undefined
  return process.env[envVar]
}

/**
 * Indique si une variable d'environnement est configurée pour un provider.
 * Retourne uniquement un booléen — la valeur n'est jamais exposée.
 * Côté serveur uniquement.
 */
export function isEnvKeyConfigured(provider: string): boolean {
  const envVar = PROVIDER_ENV_VARS[provider]
  if (!envVar) return false
  return !!process.env[envVar]
}
