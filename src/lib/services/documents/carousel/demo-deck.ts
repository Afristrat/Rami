import { carouselSchema, type Carousel } from "@/lib/schemas/carousel.schema"

// Deck démo « Négociation Augmentée » — partagé par la page d'aperçu et la
// route PDF (source unique, zéro duplication).
export const DEMO_CAROUSEL: Carousel = carouselSchema.parse({
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
