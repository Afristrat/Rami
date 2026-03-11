/**
 * Router de publication — dispatch vers le bon service par plateforme.
 * Conforme SOP-004 : chaque plateforme a son service dédié.
 */

import { publishToTwitter } from "./twitter"
import { publishToLinkedIn } from "./linkedin"
import { publishToFacebook } from "./facebook"
import { publishToInstagram } from "./instagram"
import { publishToPinterest } from "./pinterest"
import type { PublisherInput, PublishResult } from "./types"

export type { PublisherInput, PublishResult } from "./types"

export type SupportedPlatform =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "pinterest"

const PUBLISHERS: Record<
  SupportedPlatform,
  (input: PublisherInput) => Promise<PublishResult>
> = {
  twitter: publishToTwitter,
  linkedin: publishToLinkedIn,
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  pinterest: publishToPinterest,
}

/**
 * Publie le contenu sur une plateforme donnée.
 * Retourne toujours un PublishResult — jamais de throw non-capturé.
 */
export async function publishToPlatform(
  platform: string,
  input: PublisherInput
): Promise<PublishResult> {
  const publisher = PUBLISHERS[platform as SupportedPlatform]

  if (!publisher) {
    return {
      platform,
      status: "failed",
      error: `Plateforme "${platform}" non supportée pour la publication directe.`,
    }
  }

  return publisher(input)
}

export const SUPPORTED_PLATFORMS = Object.keys(PUBLISHERS) as SupportedPlatform[]
