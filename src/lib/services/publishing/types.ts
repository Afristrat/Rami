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

/** Visibilité d'une vidéo YouTube. */
export type YouTubePrivacy = "public" | "unlisted" | "private"

/**
 * Mode de publication TikTok :
 * - `direct` : Direct Post (publié directement sur le compte ; requiert une app auditée en prod).
 * - `draft`  : déposé en brouillon dans l'app TikTok de l'utilisateur, qui finalise/publie.
 */
export type TikTokPublishMode = "direct" | "draft"

/** Options spécifiques aux plateformes vidéo (YouTube, TikTok). Toutes optionnelles → défauts dans les services. */
export interface VideoPublishOptions {
  /** Titre de la vidéo (YouTube/TikTok). Défaut : dérivé du contenu. */
  title?: string
  /** YouTube : visibilité. Défaut `public`. */
  privacyStatus?: YouTubePrivacy
  /** TikTok : mode de publication. Défaut `direct`. */
  tiktokMode?: TikTokPublishMode
  /**
   * TikTok : niveau de confidentialité Direct Post (ex. `PUBLIC_TO_EVERYONE`,
   * `SELF_ONLY`). Défaut `PUBLIC_TO_EVERYONE` ; une app non auditée (sandbox)
   * impose `SELF_ONLY`.
   */
  tiktokPrivacyLevel?: string
}

export interface PublisherInput {
  accessToken: string
  content: string
  mediaUrls?: string[]
  accountId?: string    // ID du compte sur la plateforme (si requis)
  accountName?: string
  videoOptions?: VideoPublishOptions
}
