"use client"

// ============================================================
// Création d'un carrousel : sujet/brief → génération IA → aperçu fidèle →
// téléchargement du PDF (document LinkedIn). Le PDF se télécharge via fetch()
// + blob() (Cloudflare gzippe les binaires → un <a download> brut corromprait
// le fichier ; on ne sauve que si la réponse est OK).
// ============================================================

import { useState, useTransition } from "react"
import { CarouselPreview } from "@/components/carousel/CarouselPreview"
import { createCarouselAction } from "@/lib/actions/carousel.actions"
import type { Carousel } from "@/lib/schemas/carousel.schema"

export function CarouselCreator({
  initialAccent = "#1D4ED8",
  initialHandle = "",
}: {
  /** Accent par défaut = couleur de marque (Brand DNA). Le user peut le changer. */
  initialAccent?: string
  initialHandle?: string
}) {
  const [brief, setBrief] = useState("")
  const [handle, setHandle] = useState(initialHandle)
  const [accentHex, setAccentHex] = useState(initialAccent)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [slideCount, setSlideCount] = useState(7)
  const [carousel, setCarousel] = useState<Carousel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [pending, startGen] = useTransition()

  function handleGenerate() {
    setError(null)
    startGen(async () => {
      const res = await createCarouselAction({ brief, handle: handle || undefined, accentHex, theme, slideCount })
      if (res.success) setCarousel(res.carousel)
      else
        setError(
          res.error === "brief_too_short"
            ? "Décris ton sujet en quelques phrases (au moins 10 caractères)."
            : "La génération a échoué. Réessaie ou précise ton brief.",
        )
    })
  }

  async function handleDownload() {
    if (!carousel) return
    setDownloading(true)
    setError(null)
    try {
      const res = await fetch("/api/carousel/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(carousel),
      })
      if (!res.ok) throw new Error("pdf_failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "carrousel-rami.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError("Le téléchargement du PDF a échoué.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      {/* Formulaire */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-200">Sujet du carrousel</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={7}
            placeholder="Ex. : Les 5 frameworks de négociation augmentés par l'IA agentique (BATNA, ZOPA, Harvard…). Pour un public de dirigeants B2B."
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Auteur / handle</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Med Amine Mansouri"
              className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Nombre de slides</label>
            <input
              type="number"
              min={5}
              max={10}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Couleur d&apos;accent</label>
            <input
              type="color"
              value={accentHex}
              onChange={(e) => setAccentHex(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Thème</label>
            <div className="flex gap-1.5">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                    theme === t
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {t === "dark" ? "Sombre" : "Clair"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Génération du carrousel…" : "Générer le carrousel"}
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Aperçu + export */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        {carousel ? (
          <div className="space-y-4">
            <CarouselPreview carousel={carousel} maxWidth={420} />
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {downloading ? "Préparation du PDF…" : "Télécharger le PDF (document LinkedIn)"}
            </button>
          </div>
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
            L&apos;aperçu du carrousel apparaîtra ici après génération.
          </div>
        )}
      </div>
    </div>
  )
}
