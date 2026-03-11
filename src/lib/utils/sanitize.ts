/**
 * Sanitise les inputs avant envoi aux LLMs.
 * Prévient les injections de prompt (prompt injection attacks).
 */
export function sanitizePromptInput(input: string): string {
  return input
    .replace(/system:/gi, "")
    .replace(/\[INST\]/gi, "")
    .replace(/ignore previous instructions/gi, "")
    .replace(/forget your instructions/gi, "")
    .replace(/you are now/gi, "")
    .replace(/act as/gi, "")
    .trim()
    .slice(0, 2000)
}

/**
 * Vérifie que le type MIME d'un fichier uploadé est autorisé.
 */
export function isAllowedImageMime(mime: string): boolean {
  return ["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(mime)
}
