"use client"

// ============================================================
// Page de validation humaine — aperçu fidèle de toutes les plateformes cibles
// + bouton d'approbation qui déverrouille la publication (verrou serveur).
// Réutilise PlatformPreview. C'est la cible du lien approvalUrl renvoyé par
// l'API v1 (chemin Hermès) quand un post n'est pas encore approuvé.
// ============================================================

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlatformPreview } from "@/components/preview/platform-preview"
import { approvePostForPublish } from "@/lib/actions/publish-approval.actions"
import type { Platform } from "@/lib/scheduler/platform-config"

export interface ReviewClientProps {
  postId: string
  content: string
  platforms: Platform[]
  mediaUrls: string[]
  accountName: string
  isApproved: boolean
}

export function ReviewClient({
  postId,
  content,
  platforms,
  mediaUrls,
  accountName,
  isApproved,
}: ReviewClientProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [approved, setApproved] = useState(isApproved)

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const res = await approvePostForPublish(postId)
      if (res.success) {
        setApproved(true)
        router.refresh()
      } else {
        setError(res.error ?? "Échec de l'approbation.")
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Valider avant publication</h1>
        <p className="text-sm text-zinc-500">
          Vérifiez le rendu réel sur chaque réseau. La publication reste bloquée tant qu&apos;un membre
          n&apos;a pas approuvé.
        </p>
      </header>

      <div className="space-y-5">
        {platforms.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Aucune plateforme sélectionnée pour ce post.
          </p>
        ) : (
          platforms.map((p) => (
            <PlatformPreview
              key={p}
              platform={p}
              content={content}
              mediaUrls={mediaUrls}
              accountName={accountName}
            />
          ))
        )}
      </div>

      <div className="sticky bottom-0 rounded-xl border border-zinc-200 bg-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        {approved ? (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <span aria-hidden>✓</span> Approuvé pour publication. La publication peut maintenant partir.
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={pending || platforms.length === 0}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Approbation…" : "Approuver pour publication"}
            </button>
            {error && <p className="text-center text-xs text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
