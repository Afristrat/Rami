// ============================================================
// Démo design du moteur de carrousel natif RAMI (étape 1 — validation design).
// Reprend le contenu « Négociation Augmentée » (artisan : version Hermès tronquée
// + accents perdus à la publication) rendu ici en slides React 4:5 soignées,
// accents parfaits, sans troncature ni chrome navigateur. Route publique.
// ============================================================

import type { Metadata } from "next"
import { CarouselPreview } from "@/components/carousel/CarouselPreview"
import { carouselSchema, type Carousel } from "@/lib/schemas/carousel.schema"

export const metadata: Metadata = {
  title: "Démo carrousel — RAMI",
  robots: { index: false, follow: false },
}

const DEMO: Carousel = carouselSchema.parse({
  theme: "dark",
  accentHex: "#F59E0B",
  handle: "Med Amine Mansouri",
  author: "AI-MPower",
  slides: [
    {
      type: "cover",
      eyebrow: "Intelligence augmentée",
      title: "Négociation Augmentée",
      subtitle: "Comment l'IA agentique révolutionne l'art du deal",
      author: "par Med Amine Mansouri — Venture Builder, AI-MPower",
    },
    {
      type: "point",
      heading: "Les frameworks n'ont pas changé. L'exécution, si.",
      body:
        "BATNA, ZOPA, Harvard Principled Negotiation — 40 ans de science de la négociation enseignée dans les business schools. La théorie est solide. Mais son exécution est restée artisanale.",
    },
    {
      type: "point",
      index: "01",
      heading: "Le BATNA Augmenté",
      body:
        "Le BATNA (Fisher & Ury, 1981) est le concept le plus puissant de la négociation. Mais il a une faiblesse structurelle : il est statique.",
    },
    {
      type: "comparison",
      leftTitle: "Classique",
      leftItems: [
        "Une alternative, définie à l'avance",
        "Basée sur votre connaissance du marché",
        "Si vous ratez une information, votre BATNA est incomplet",
      ],
      rightTitle: "Augmenté",
      rightItems: [
        "Un arbre d'alternatives vivant",
        "Un agent scrappe, analyse, simule 50 scénarios",
        "Mis à jour en temps réel",
      ],
    },
    {
      type: "stat",
      value: "1 000",
      label: "scénarios ZOPA simulés avant le premier mot",
      context:
        "Un humain explore en moyenne 4 à 5 combinaisons dans une négociation B2B complexe. Un agent en explore mille.",
    },
    {
      type: "point",
      index: "03",
      heading: "Psychologie Algorithmique",
      body:
        "Le cœur de la méthode Harvard : comprendre les intérêts, pas les positions. Mais les intérêts sont rarement déclarés.",
      bullets: [
        "Patterns de langage : modaux, ratio « nous » vs « je », certitude lexicale",
        "Micro-changements tonaux : une baisse de variabilité signale un point sensible",
      ],
    },
    {
      type: "cta",
      heading: "Le charisme est un talent. La préparation est un système.",
      body: "Ces 5 piliers augmentés transforment chaque négociation en avantage asymétrique.",
      action: "Découvrir la méthode",
    },
  ],
})

export default function CarouselDemoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Carrousel RAMI — démo design</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Même contenu que la version Hermès, rendu en slides React 4:5 : accents parfaits, aucune
          troncature, aucun chrome navigateur. Fais défiler avec les flèches ou les points.
        </p>
      </header>
      <CarouselPreview carousel={DEMO} maxWidth={460} />
    </main>
  )
}
