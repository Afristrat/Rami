/**
 * Types partagés pour les services de publication RAMI.
 */

export type PublishStatus = "published" | "failed"

export interface PublishResult {
  platform: string
  status: PublishStatus
  postId?: string       // ID du post sur la plateforme
  postUrl?: string      // URL publique du post
  error?: string        // Message d'erreur explicite
}

export interface PublisherInput {
  accessToken: string
  content: string
  mediaUrls?: string[]
  accountId?: string    // ID du compte sur la plateforme (si requis)
  accountName?: string
}
