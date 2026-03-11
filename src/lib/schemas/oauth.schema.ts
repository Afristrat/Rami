import { z } from "zod"

export const VALID_PLATFORMS = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "pinterest",
] as const

export type OAuthPlatformSlug = (typeof VALID_PLATFORMS)[number]

/** Validation du paramètre [platform] dans les routes OAuth */
export const PlatformParamSchema = z.enum(VALID_PLATFORMS)

/** Body POST /api/oauth/[platform]/refresh */
export const RefreshBodySchema = z.object({
  connectionId: z.string().uuid().optional(),
})

/** Paramètres query du callback OAuth */
export const OAuthCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
})
