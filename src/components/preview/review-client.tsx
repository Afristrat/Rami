"use client"

// ============================================================
// Poste de pilotage de validation (Piliers 2+3).
// L'utilisateur VOIT le rendu fidèle par plateforme, ÉDITE le texte, applique
// des PRESETS DE CORRECTION cliquables (régénération IA sans inventer),
// ENREGISTRE, puis APPROUVE. L'approbation est le dernier geste — jamais le
// seul. Cible du lien approvalUrl renvoyé par l'API v1 (chemin Hermès).
// ============================================================

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlatformPreview } from "@/components/preview/platform-preview"
import { approvePostForPublish } from "@/lib/actions/publish-approval.actions"
import { applyCorrectionPresetsAction } from "@/lib/actions/correction.actions"
import { updateDraftContentAction } from "@/lib/actions/approval-board.actions"
import { TEXT_CORRECTION_PRESETS } from "@/lib/services/workflow/correction-presets"
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
  content: initialContent,
  platforms,
  mediaUrls,
  accountName,
  isApproved,
}: ReviewClientProps) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [savedContent, setSavedContent] = useState(initialContent)
  const [approved, setApproved] = useState(isApproved)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [freeText, setFreeText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [regenPending, startRegen] = useTransition()
  const [savePending, startSave] = useTransition()
  const [approvePending, startApprove] = useTransition()

  const dirty = content !== savedContent
  const primaryPlatform = platforms[0]

  function togglePreset(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleRegenerate() {
    setError(null)
    setNotice(null)
    startRegen(async () => {
      const res = await applyCorrectionPresetsAction({
        postId,
        currentContent: content,
        platform: primaryPlatform,
        presetIds: Array.from(selected),
        freeText: freeText.trim() || undefined,
      })
      if (res.success) {
        setContent(res.content)
        setNotice("Texte régénéré — relis puis enregistre.")
      } else {
        setError(
          res.error === "no_correction"
            ? "Choisis au moins une correction (ou écris une consigne)."
            : "La régénération a échoué. Réessaie.",
        )
      }
    })
  }

  function handleSave() {
    setError(null)
    setNotice(null)
    startSave(async () => {
      const res = await updateDraftContentAction(postId, content)
      if (res.success) {
        setSavedContent(content)
        setApproved(false) // toute édition réinitialise l'approbation (verrou)
        setNotice("Modifications enregistrées.")
        router.refresh()
      } else {
        setError("Échec de l'enregistrement.")
      }
    })
  }

  function handleApprove() {
    setError(null)
    setNotice(null)
    startApprove(async () => {
      const res = await approvePostForPublish(postId)
      if (res.success) {
        setApproved(true)
        router.refresh()
      } else {
        setError(res.error ?? "Échec de l'approbation.")
      }
    })
  }

  const previews = useMemo(
    () =>
      platforms.map((p) => (
        <PlatformPreview
          key={p}
          platform={p}
          content={content}
          mediaUrls={mediaUrls}
          accountName={accountName}
        />
      )),
    [platforms, content, mediaUrls, accountName],
  )

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Valider avant publication</h1>
        <p className="text-sm text-zinc-500">
          Vérifiez le rendu réel, corrigez ce qui doit l&apos;être, puis approuvez. Rien ne se publie
          sans approbation.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,380px)]">
        {/* Aperçus fidèles (live) */}
        <div className="space-y-5">
          {platforms.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
              Aucune plateforme sélectionnée pour ce post.
            </p>
          ) : (
            previews
          )}
        </div>

        {/* Poste de pilotage */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <label className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Texte du post
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />

            <div className="mt-3">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Corrections (clique, puis régénère)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TEXT_CORRECTION_PRESETS.map((p) => {
                  const on = selected.has(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePreset(p.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        on
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
              <input
                type="text"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Consigne libre (optionnel)…"
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenPending}
                className="mt-2 w-full rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
              >
                {regenPending ? "Régénération…" : "🪄 Régénérer le texte avec ces corrections"}
              </button>
            </div>
          </div>

          {(error || notice) && (
            <p className={`text-xs ${error ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
              {error ?? notice}
            </p>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            {approved && !dirty ? (
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                <span aria-hidden>✓</span> Approuvé pour publication.
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={savePending || !dirty}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {savePending ? "Enregistrement…" : dirty ? "Enregistrer les modifications" : "Aucune modification"}
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={approvePending || dirty || platforms.length === 0}
                  title={dirty ? "Enregistre d'abord tes modifications" : undefined}
                  className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {approvePending ? "Approbation…" : "Approuver pour publication"}
                </button>
                {dirty && (
                  <p className="text-center text-xs text-amber-600 dark:text-amber-400">
                    Enregistre tes modifications avant d&apos;approuver.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
