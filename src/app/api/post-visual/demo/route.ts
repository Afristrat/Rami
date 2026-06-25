import { renderPostVisualToPng } from "@/lib/services/post-visual/render"
import type { PostVisual } from "@/lib/schemas/post-visual.schema"

// Démo publique du moteur de composition « post visuel » : prouve en prod que le
// rendu (next/og + Noto) produit une image aux ACCENTS PARFAITS, indépendamment
// du parcours complet. Carte fixe (aucune donnée tenant). À retirer après validation.
export const runtime = "nodejs"

const SAMPLE: PostVisual = {
  format: "1:1",
  theme: "dark",
  accentHex: "#16A34A",
  handle: "@ai-mpower",
  layout: {
    type: "headline",
    eyebrow: "Étude de cas",
    title: "L'IA qui vise juste — accents impeccables, à coup sûr",
    subtitle: "Texte composé par le code (Noto), pas halluciné par l'IA image.",
  },
}

export async function GET(): Promise<Response> {
  const png = await renderPostVisualToPng(SAMPLE)
  return new Response(new Uint8Array(png), {
    headers: { "content-type": "image/png", "cache-control": "no-store" },
  })
}
