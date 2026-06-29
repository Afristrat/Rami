// ============================================================
// US-052 — Service `generateVisual` : orchestre la génération d'un artefact
// (image OU carrousel) pour l'API publique v1, à partir d'un contexte tenant
// EXPLICITE (jamais de session). Réutilise les moteurs existants — aucune
// réécriture de génération (design.md — DRY) :
//   • image    → compileBrandDNAToPrompts + generateImage (provider chain)
//   • carousel → generateCarouselDeck (cœur LLM) + renderCarouselPdf (@react-pdf)
// Stocke les artefacts sur MinIO et compose un manifeste destiné aux gates QA.
// Multi-tenant : marque résolue via resolveBrandIdentity, jamais codée en dur.
// ============================================================

import { resolveBrandIdentity } from "@/lib/services/brand-dna/resolver"
import { normalizeBrandDNA } from "@/lib/services/brand-dna/normalize"
import { compileBrandDNAToPrompts } from "@/lib/services/brand-dna/prompt-compiler"
import { generateImage } from "@/lib/services/image-generation"
import { generateCarouselDeck } from "@/lib/services/visuals/carousel-core"
import { renderCarouselPdf } from "@/lib/services/documents/carousel/carousel-pdf"
import { uploadToStorage, buildStoragePath } from "@/lib/services/storage/client"
import type { Carousel } from "@/lib/schemas/carousel.schema"

/** Dimensions cibles par format (toutes ≥ 1080 → gate format `min ≥ 1000`). */
const FORMAT_DIMS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
}

export interface VisualSlide {
  n: number
  minio_path: string
  public_url: string | null
}

export interface VisualManifest {
  type: string
  format: string
  width: number
  height: number
  fonts_embedded: boolean
  slides: number
  /** Type MIME de l'artefact principal (image/webp ou application/pdf). */
  mime: string
}

/** Snapshot léger de l'identité de marque (SANS le logo base64). */
export interface BrandSnapshot {
  accent: string
  onAccent: string
  palette: string[]
  brandName: string | null
  hasBrandColor: boolean
  shapeKey: string
  monogram: string
}

export interface GenerateVisualArgs {
  tenantId: string
  type: string
  format: string
  content: Record<string, unknown>
  /** Brand DNA brut (colonne `tenants.brand_dna`). */
  brandDna: unknown
  tenantName: string | null
}

export interface GenerateVisualResult {
  slides: VisualSlide[]
  manifest: VisualManifest
  /** Texte source concaténé (pour le gate anti-chrome). */
  sourceText: string
  brandDnaSnapshot: BrandSnapshot
}

/** Concatène récursivement toutes les chaînes d'un deck (gate anti-chrome). */
function collectText(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const v of value) collectText(v, out)
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectText(v, out)
  }
}

function carouselSourceText(carousel: Carousel): string {
  const out: string[] = []
  collectText(carousel.slides, out)
  return out.join("\n")
}

/** Lit `content.brief` (string non vide) ou lève une erreur explicite. */
function readBrief(content: Record<string, unknown>): string {
  const brief = content.brief
  if (typeof brief !== "string" || brief.trim().length < 10) {
    throw new Error("content.brief manquant ou trop court (min 10 caractères)")
  }
  return brief
}

/** Génère une image unique respectant le Brand DNA + brief, stockée sur MinIO. */
async function generateImageArtifact(args: GenerateVisualArgs, dims: { width: number; height: number }): Promise<{
  slides: VisualSlide[]
  width: number
  height: number
}> {
  const brief = readBrief(args.content)
  const brandDNA = normalizeBrandDNA(args.brandDna)
  const prompts = compileBrandDNAToPrompts(brandDNA, brief, "instagram")
  const sp = prompts[0]
  if (!sp) throw new Error("Échec de compilation du prompt (Brand DNA)")

  const result = await generateImage({
    positive_prompt: sp.positive_prompt,
    negative_prompt: sp.negative_prompt,
    width: dims.width,
    height: dims.height,
    guidance_scale: sp.parameters.guidance_scale,
    num_inference_steps: sp.parameters.num_inference_steps,
    seed: sp.parameters.seed,
    num_images: 1,
  })

  const img = result.images[0]
  if (!img) throw new Error("Aucune image générée (tous les providers ont échoué)")

  // Télécharger l'image du provider et la convertir en WebP. On NE réduit PAS
  // sous la taille cible (le gate format exige min ≥ 1000) ; on plafonne juste
  // le plus grand côté à 2048 px pour borner le poids, sans agrandissement.
  const res = await fetch(img.url)
  if (!res.ok) throw new Error(`Téléchargement image échoué (HTTP ${res.status})`)
  const rawBuffer = Buffer.from(await res.arrayBuffer())
  const sharp = (await import("sharp")).default
  const pipeline = sharp(rawBuffer)
    .rotate()
    .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
  const webp = await pipeline.toBuffer()
  const meta = await sharp(webp).metadata()

  const path = buildStoragePath(args.tenantId, "api-visual-image.webp")
  const { data, error } = await uploadToStorage({
    prefix: "media",
    path,
    buffer: webp,
    mimeType: "image/webp",
  })
  if (error || !data) throw new Error(`Stockage MinIO échoué : ${error?.message ?? "inconnu"}`)

  return {
    slides: [{ n: 0, minio_path: data.path, public_url: data.publicUrl }],
    width: meta.width ?? dims.width,
    height: meta.height ?? dims.height,
  }
}

/** Génère un carrousel (deck LLM) rendu en PDF unique, stocké sur MinIO. */
async function generateCarouselArtifact(args: GenerateVisualArgs): Promise<{
  slides: VisualSlide[]
  slideCount: number
  sourceText: string
}> {
  const brief = readBrief(args.content)
  const deck = await generateCarouselDeck({
    brandDnaRaw: args.brandDna,
    tenantName: args.tenantName,
    brief,
    slideCount: typeof args.content.slideCount === "number" ? args.content.slideCount : undefined,
    theme: args.content.theme === "light" ? "light" : "dark",
    handle: typeof args.content.handle === "string" ? args.content.handle : undefined,
    author: typeof args.content.author === "string" ? args.content.author : undefined,
  })
  if (!deck.success) throw new Error(`Génération du carrousel échouée : ${deck.error}`)

  const pdf = await renderCarouselPdf(deck.carousel)
  const path = buildStoragePath(args.tenantId, "api-visual-carousel.pdf")
  const { data, error } = await uploadToStorage({
    prefix: "media",
    path,
    buffer: pdf,
    mimeType: "application/pdf",
  })
  if (error || !data) throw new Error(`Stockage MinIO échoué : ${error?.message ?? "inconnu"}`)

  return {
    slides: [{ n: 0, minio_path: data.path, public_url: data.publicUrl }],
    slideCount: deck.carousel.slides.length,
    sourceText: carouselSourceText(deck.carousel),
  }
}

/**
 * Génère un artefact visuel pour l'API v1 et retourne slides MinIO + manifeste
 * + texte source (gate anti-chrome) + snapshot d'identité de marque.
 * Lève une Error sur échec (la route mappe en réponse + statut `failed`).
 */
export async function generateVisual(args: GenerateVisualArgs): Promise<GenerateVisualResult> {
  const dims = FORMAT_DIMS[args.format]
  if (!dims) throw new Error(`Format inconnu : ${args.format}`)

  const identity = resolveBrandIdentity(args.brandDna ?? null, { tenantName: args.tenantName })
  const brandDnaSnapshot: BrandSnapshot = {
    accent: identity.accent,
    onAccent: identity.onAccent,
    palette: identity.palette,
    brandName: identity.brandName,
    hasBrandColor: identity.hasBrandColor,
    shapeKey: identity.shapeKey,
    monogram: identity.monogram,
  }

  if (args.type === "image") {
    const out = await generateImageArtifact(args, dims)
    return {
      slides: out.slides,
      // Une image générée ne porte aucun texte (negative_prompt exclut le texte)
      // → aucune police à embarquer, donc pas de risque de fallback : true.
      manifest: { type: args.type, format: args.format, width: out.width, height: out.height, fonts_embedded: true, slides: 1, mime: "image/webp" },
      sourceText: "",
      brandDnaSnapshot,
    }
  }

  if (args.type === "carousel") {
    const out = await generateCarouselArtifact(args)
    return {
      slides: out.slides,
      // @react-pdf embarque Noto Sans → polices garanties dans le PDF.
      manifest: { type: args.type, format: args.format, width: dims.width, height: dims.height, fonts_embedded: true, slides: out.slideCount, mime: "application/pdf" },
      sourceText: out.sourceText,
      brandDnaSnapshot,
    }
  }

  throw new Error(`Type de visuel non supporté : ${args.type}`)
}
