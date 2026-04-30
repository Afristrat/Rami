import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"

export const FONT_FAMILIES = [
  "Inter", "Geist", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins",
  "Raleway", "Playfair Display", "Merriweather", "Source Sans Pro", "Nunito",
  "Work Sans", "DM Sans", "Space Grotesk", "Plus Jakarta Sans",
  "IBM Plex Sans", "Outfit", "Manrope", "Sora",
] as const

export const FONT_WEIGHTS = [
  { id: "normal" },
  { id: "medium" },
  { id: "semibold" },
  { id: "bold" },
  { id: "black" },
] as const

export type FontFamily = typeof FONT_FAMILIES[number]
export type FontWeightId = typeof FONT_WEIGHTS[number]["id"]

const typographyLevelSchema = z.object({
  family: z.string(),
  size: z.number().min(10).max(96),
  weight: z.string(),
})

export const typographySchema = z.object({
  heading: typographyLevelSchema.optional(),
  subheading: typographyLevelSchema.optional(),
  body: typographyLevelSchema.optional(),
})

export type TypographyLevel = z.infer<typeof typographyLevelSchema>
export type Typography = z.infer<typeof typographySchema>

export const CAUSSE_COLORS = [
  { id: "bleu_marine", hex: "#1E3A5F", sectors: ["finance", "tech", "santé", "B2B"] },
  { id: "bleu_roi", hex: "#1D4ED8", sectors: ["tech", "corporate", "éducation"] },
  { id: "rouge_passion", hex: "#DC2626", sectors: ["retail", "food", "sport", "entertainment"] },
  { id: "vert_emeraude", hex: "#059669", sectors: ["santé", "bio", "finance_durable", "islam"] },
  { id: "violet_creatif", hex: "#7C3AED", sectors: ["luxe", "beauté", "tech_créative", "spirituel"] },
  { id: "orange_chaleureux", hex: "#EA580C", sectors: ["food", "divertissement", "startup", "sport"] },
  { id: "jaune_optimiste", hex: "#D97706", sectors: ["éducation", "enfants", "créativité", "tourisme"] },
  { id: "rose_empathique", hex: "#DB2777", sectors: ["beauté", "santé_mentale", "bien-être", "mode_feminine"] },
  { id: "or_prestige", hex: "#B45309", sectors: ["luxe", "finance", "hospitality", "bijouterie"] },
  { id: "noir_elegance", hex: "#0F172A", sectors: ["luxe", "mode", "tech_premium", "automotive"] },
  { id: "turquoise_innovation", hex: "#0891B2", sectors: ["tech", "santé", "bien-être", "environnement"] },
  { id: "bordeaux_premium", hex: "#9F1239", sectors: ["santé", "éducation", "droit", "vin"] },
] as const

export type CausseColor = typeof CAUSSE_COLORS[number]

export const VOICE_TONES = [
  { id: "expert", icon: "🎓" },
  { id: "bienveillant", icon: "🤝" },
  { id: "inspirant", icon: "🚀" },
  { id: "ludique", icon: "🎨" },
  { id: "premium", icon: "💎" },
  { id: "direct", icon: "⚡" },
] as const

export type VoiceTone = typeof VOICE_TONES[number]

export const brandDnaFormSchema = z.object({
  // Identité
  brandName: z.string().min(1, V.brandNameRequired).max(100),
  tagline: z.string().max(150).optional(),
  sector: z.string().min(1, V.sectorRequired),
  /** Précision libre obligatoire quand sector === "autre" */
  sectorCustom: z.string().max(200).optional(),
  positioning: z.string().min(10, V.positioningMinLength).max(500),

  // Logo
  logoDataUrl: z.string().optional(),
  logoFileName: z.string().optional(),

  // Palette couleurs (3 couleurs Causse)
  colorPrimary: z.string().min(1, V.colorPrimaryRequired),
  colorSecondary: z.string().min(1, V.colorSecondaryRequired),
  colorAccent: z.string().min(1, V.colorAccentRequired),

  // Ton de voix
  voiceTone: z.string().min(1, V.voiceToneRequired),

  // Objectifs cognitifs — multi-sélection (FEATURE 3)
  // objectifsCognitifs[0] = objectif dominant (premier sélectionné)
  objectifsCognitifs: z.array(z.string()).optional(),
  /** Textarea libre pour la carte "Épatez-nous" */
  objectifCognitifCustom: z.string().max(500).optional(),
  /** Compatibilité ascendante avec les données sauvegardées avant v1.1 */
  objectifCognitif: z.string().optional(),

  // Culture cible
  primaryCulture: z.string().optional(),

  // Typographie (hiérarchie visuelle)
  typography: typographySchema.optional(),

  // Audience
  audienceDescription: z
    .string()
    .min(20, V.audienceMinLength)
    .max(1000),
  audienceAge: z.string().optional(),
  audienceLocation: z.string().optional(),
  audiencePainPoints: z.string().max(500).optional(),
})

export type BrandDnaFormData = z.infer<typeof brandDnaFormSchema>

/**
 * Objectifs cognitifs — moteur de sélection des styles visuels.
 * FEATURE 3 + 4 : multi-sélection + promesses concrètes.
 * Source : CLAUDE.md §2.2 règles de décision.
 */
export const COGNITIVE_OBJECTIVES = [
  { id: "confiance", icon: "🏛️", visualStyles: ["Blueprint", "Scientifique"] },
  { id: "urgence", icon: "⚡", visualStyles: ["Machine", "Narratif"] },
  { id: "aspiration", icon: "✨", visualStyles: ["Carte/Tuile", "Narratif"] },
  { id: "expertise", icon: "🎓", visualStyles: ["Dashboard", "Stack"] },
  { id: "communaute", icon: "🤝", visualStyles: ["Narratif", "Carte/Tuile"] },
  { id: "joie", icon: "🎉", visualStyles: ["Narratif", "Machine"] },
  { id: "epatez_nous", icon: "🎨", visualStyles: [] as string[], hasCustomInput: true },
] as const

export type CognitiveObjective = typeof COGNITIVE_OBJECTIVES[number]

export const CULTURES = [
  { id: "maroc", flag: "🇲🇦" },
  { id: "afrique_subsaharienne", flag: "🌍" },
  { id: "europe_francophone", flag: "🇫🇷" },
  { id: "moyen_orient", flag: "🌙" },
  { id: "international", flag: "🌐" },
] as const

export type Culture = typeof CULTURES[number]
export type CultureId = Culture["id"]

/**
 * 30 secteurs détaillés + "Autre" avec champ libre (FEATURE 2).
 * Les valeurs servent d'identifiants techniques et de clés DB.
 * Les labels humains sont dans messages/{locale}.json sous brandDna.sectors.{id}
 */
export const SECTORS = [
  // Finance
  "finance_banque",
  "finance_islamique",
  "assurance_mutuelles",
  // Immobilier & Construction
  "immobilier_promotion",
  "btp_construction",
  // Industrie
  "industrie_manufacturing",
  "agroalimentaire_agriculture",
  "energie_environnement",
  // Santé
  "sante_medical",
  "pharmacie_parapharmacie",
  "bien_etre_spa",
  // Tech
  "tech_saas",
  "ia_data",
  "cybersecurite",
  "ecommerce_marketplace",
  "telecommunications",
  // Éducation
  "education_formation",
  "edtech_elearning",
  // Médias & Marketing
  "media_presse",
  "marketing_publicite",
  // Services
  "consulting_conseil",
  "ressources_humaines",
  "juridique_droit",
  // Luxe & Mode
  "luxe_haute_couture",
  "mode_pret_a_porter",
  "beaute_cosmetiques",
  // Lifestyle
  "sport_fitness",
  "tourisme_hospitality",
  "restauration_food",
  // Impact
  "ong_social_impact",
  // Libre
  "autre",
] as const

/**
 * Notes culturelles Causse x culture pour chaque couleur.
 * Les combinaisons couleur x culture qui ont une note culturelle.
 * Les textes humains sont dans messages/{locale}.json sous brandDna.cultureColorNotes.{colorId}.{cultureId}
 */
export const CULTURE_COLOR_NOTES: Record<string, Partial<Record<string, true>>> = {
  bleu_marine: { maroc: true, moyen_orient: true, europe_francophone: true },
  bleu_roi: { maroc: true, europe_francophone: true, international: true },
  rouge_passion: { maroc: true, moyen_orient: true, afrique_subsaharienne: true },
  vert_emeraude: { maroc: true, moyen_orient: true, afrique_subsaharienne: true, international: true },
  or_prestige: { maroc: true, moyen_orient: true, afrique_subsaharienne: true },
  noir_elegance: { europe_francophone: true, moyen_orient: true, international: true },
  rose_empathique: { maroc: true, europe_francophone: true },
  turquoise_innovation: { maroc: true, moyen_orient: true },
}

/**
 * Recommandations Causse par secteur (clés = sector IDs).
 * avoidReason moved to i18n: brandDna.sectorColorRules.{sectorId}.avoidReason
 */
export const SECTOR_COLOR_RULES: Record<string, {
  recommended: string[]
  avoid: string[]
  avoidReasonKey?: string
  avoidAlternative?: string
}> = {
  finance_banque: {
    recommended: ["bleu_marine", "bleu_roi", "or_prestige", "noir_elegance"],
    avoid: ["orange_chaleureux", "rose_empathique", "jaune_optimiste"],
  },
  finance_islamique: {
    recommended: ["vert_emeraude", "bleu_marine", "or_prestige"],
    avoid: ["rouge_passion", "rose_empathique"],
    avoidReasonKey: "finance_islamique",
    avoidAlternative: "bordeaux_premium",
  },
  assurance_mutuelles: {
    recommended: ["bleu_marine", "bleu_roi", "vert_emeraude"],
    avoid: ["rouge_passion", "orange_chaleureux"],
  },
  sante_medical: {
    recommended: ["bleu_marine", "bleu_roi", "turquoise_innovation", "vert_emeraude"],
    avoid: ["rouge_passion"],
    avoidReasonKey: "sante_medical",
    avoidAlternative: "bordeaux_premium",
  },
  pharmacie_parapharmacie: {
    recommended: ["bleu_roi", "vert_emeraude", "turquoise_innovation"],
    avoid: ["rouge_passion"],
    avoidAlternative: "bordeaux_premium",
  },
  bien_etre_spa: {
    recommended: ["turquoise_innovation", "vert_emeraude", "rose_empathique", "violet_creatif"],
    avoid: ["noir_elegance"],
  },
  tech_saas: {
    recommended: ["bleu_roi", "violet_creatif", "turquoise_innovation", "noir_elegance"],
    avoid: [],
  },
  ia_data: {
    recommended: ["bleu_marine", "violet_creatif", "turquoise_innovation", "noir_elegance"],
    avoid: [],
  },
  cybersecurite: {
    recommended: ["bleu_marine", "noir_elegance", "turquoise_innovation"],
    avoid: ["jaune_optimiste", "rose_empathique"],
  },
  ecommerce_marketplace: {
    recommended: ["orange_chaleureux", "rouge_passion", "bleu_roi"],
    avoid: [],
  },
  luxe_haute_couture: {
    recommended: ["noir_elegance", "or_prestige", "bordeaux_premium", "violet_creatif"],
    avoid: ["orange_chaleureux", "jaune_optimiste"],
    avoidReasonKey: "luxe_haute_couture",
  },
  mode_pret_a_porter: {
    recommended: ["noir_elegance", "rose_empathique", "or_prestige"],
    avoid: [],
  },
  beaute_cosmetiques: {
    recommended: ["rose_empathique", "violet_creatif", "or_prestige", "turquoise_innovation"],
    avoid: [],
  },
  education_formation: {
    recommended: ["bleu_roi", "jaune_optimiste", "vert_emeraude", "orange_chaleureux"],
    avoid: ["noir_elegance", "bordeaux_premium"],
  },
  edtech_elearning: {
    recommended: ["bleu_roi", "violet_creatif", "orange_chaleureux"],
    avoid: [],
  },
  agroalimentaire_agriculture: {
    recommended: ["vert_emeraude", "orange_chaleureux", "rouge_passion", "or_prestige"],
    avoid: ["noir_elegance", "violet_creatif"],
  },
  energie_environnement: {
    recommended: ["vert_emeraude", "bleu_marine", "turquoise_innovation"],
    avoid: ["rouge_passion"],
  },
  ong_social_impact: {
    recommended: ["vert_emeraude", "bleu_marine", "orange_chaleureux", "rose_empathique"],
    avoid: ["noir_elegance", "or_prestige"],
    avoidReasonKey: "ong_social_impact",
  },
  sport_fitness: {
    recommended: ["rouge_passion", "orange_chaleureux", "noir_elegance", "bleu_roi"],
    avoid: ["rose_empathique", "violet_creatif"],
  },
  juridique_droit: {
    recommended: ["bleu_marine", "bordeaux_premium", "noir_elegance", "or_prestige"],
    avoid: ["orange_chaleureux", "jaune_optimiste", "rouge_passion"],
    avoidReasonKey: "juridique_droit",
  },
  tourisme_hospitality: {
    recommended: ["or_prestige", "turquoise_innovation", "orange_chaleureux", "bleu_roi"],
    avoid: [],
  },
  restauration_food: {
    recommended: ["rouge_passion", "orange_chaleureux", "jaune_optimiste"],
    avoid: ["violet_creatif", "bleu_marine"],
  },
  marketing_publicite: {
    recommended: ["orange_chaleureux", "violet_creatif", "rouge_passion"],
    avoid: [],
  },
  consulting_conseil: {
    recommended: ["bleu_marine", "bleu_roi", "noir_elegance"],
    avoid: ["jaune_optimiste", "rose_empathique"],
  },
}
