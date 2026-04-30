export interface SlideItem {
  id: string
  title: string
}

export interface PresentationBrief {
  subject: string
  audience: string
  slideCount: number
  language: "fr" | "ar" | "en"
}

export interface PresentationTheme {
  id: string
  name: string
  accentColor: string
  gradientFrom: string
  gradientTo: string
}

export interface PresentationState {
  step: 1 | 2 | 3 | 4
  brief: PresentationBrief
  slides: SlideItem[]
  selectedTheme: string
}

export const MOCK_SLIDES: SlideItem[] = [
  { id: "1", title: "Introduction et Contexte Clinique" },
  { id: "2", title: "Probl\u00E9matique et Hypoth\u00E8ses" },
  { id: "3", title: "M\u00E9thodologie de l'\u00C9valuation" },
  { id: "4", title: "Analyse des Donn\u00E9es Neurocognitives" },
  { id: "5", title: "Conclusion et Recommandations" },
]

export const MOCK_THEMES: PresentationTheme[] = [
  {
    id: "neuro-dark",
    name: "Neuro-Dark",
    accentColor: "#7c3bed",
    gradientFrom: "from-violet-600/30",
    gradientTo: "to-background",
  },
  {
    id: "corporate-blue",
    name: "Corporate Blue",
    accentColor: "#3b82f6",
    gradientFrom: "from-blue-600/20",
    gradientTo: "to-background",
  },
  {
    id: "modern-emerald",
    name: "Modern Emerald",
    accentColor: "#10b981",
    gradientFrom: "from-emerald-600/20",
    gradientTo: "to-background",
  },
]

export const PALETTE_COLORS = [
  { hex: "#7C3BED", label: "Violet" },
  { hex: "#3B82F6", label: "Blue" },
  { hex: "#10B981", label: "Emerald" },
]
