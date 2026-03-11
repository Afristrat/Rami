import { z } from "zod"

export const CAUSSE_COLORS = [
  {
    id: "bleu_marine",
    hex: "#1E3A5F",
    name: "Bleu Marine",
    emotion: "Confiance & autorité",
    psycho: "Renforce la crédibilité et inspire confiance. Couleur préférée dans la majorité des cultures mondiales.",
    sectors: ["finance", "tech", "santé", "B2B"],
  },
  {
    id: "bleu_roi",
    hex: "#1D4ED8",
    name: "Bleu Royal",
    emotion: "Sécurité & fiabilité",
    psycho: "Abaisse la fréquence cardiaque et apaise. Signe de professionnalisme universel.",
    sectors: ["tech", "corporate", "éducation"],
  },
  {
    id: "rouge_passion",
    hex: "#DC2626",
    name: "Rouge Passion",
    emotion: "Urgence & énergie",
    psycho: "Augmente la pression artérielle et le rythme cardiaque. Crée un sentiment d'urgence immédiat.",
    sectors: ["retail", "food", "sport", "entertainment"],
  },
  {
    id: "vert_emeraude",
    hex: "#059669",
    name: "Vert Émeraude",
    emotion: "Croissance & espoir",
    psycho: "Libère de la sérotonine. Dans un bureau, augmente la créativité de 15%. Symbole d'équilibre universel.",
    sectors: ["santé", "bio", "finance_durable", "islam"],
  },
  {
    id: "violet_creatif",
    hex: "#7C3AED",
    name: "Violet Créatif",
    emotion: "Luxe & mystère",
    psycho: "Combine la stabilité du bleu et l'énergie du rouge. Associé à la sagesse, la créativité et la royauté.",
    sectors: ["luxe", "beauté", "tech_créative", "spirituel"],
  },
  {
    id: "orange_chaleureux",
    hex: "#EA580C",
    name: "Orange Chaleureux",
    emotion: "Enthousiasme & accessibilité",
    psycho: "Stimule l'appétit et la sociabilité. Combinaison optimiste du rouge et du jaune. Très attrayant pour les jeunes adultes.",
    sectors: ["food", "divertissement", "startup", "sport"],
  },
  {
    id: "jaune_optimiste",
    hex: "#D97706",
    name: "Jaune Optimiste",
    emotion: "Joie & créativité",
    psycho: "Active le cortex visuel plus rapidement que toute autre couleur. Stimule la mémorisation et l'attention.",
    sectors: ["éducation", "enfants", "créativité", "tourisme"],
  },
  {
    id: "rose_empathique",
    hex: "#DB2777",
    name: "Rose Empathique",
    emotion: "Douceur & espoir",
    psycho: "Apaise l'agressivité. Le rose baker-miller réduit la tension musculaire en 10 minutes. Évoque la tendresse.",
    sectors: ["beauté", "santé_mentale", "bien-être", "mode_feminine"],
  },
  {
    id: "or_prestige",
    hex: "#B45309",
    name: "Or Prestige",
    emotion: "Succès & excellence",
    psycho: "Associé au triomphe et à l'accomplissement dans toutes les cultures. Signal de qualité supérieure immédiat.",
    sectors: ["luxe", "finance", "hospitality", "bijouterie"],
  },
  {
    id: "noir_elegance",
    hex: "#0F172A",
    name: "Noir Élégance",
    emotion: "Pouvoir & sophistication",
    psycho: "Couleur la plus puissante du spectre. Crée un sentiment d'exclusivité et d'autorité absolue.",
    sectors: ["luxe", "mode", "tech_premium", "automotive"],
  },
  {
    id: "turquoise_innovation",
    hex: "#0891B2",
    name: "Turquoise Innovation",
    emotion: "Innovation & clarté",
    psycho: "Évoque la créativité et la clarté d'esprit. Très efficace dans les secteurs en transformation digitale.",
    sectors: ["tech", "santé", "bien-être", "environnement"],
  },
  {
    id: "bordeaux_premium",
    hex: "#9F1239",
    name: "Bordeaux Premium",
    emotion: "Raffinement & passion maîtrisée",
    psycho: "Alternative au rouge dans les secteurs sensibles (santé). Combine passion et sobriété institutionnelle.",
    sectors: ["santé", "éducation", "droit", "vin"],
  },
] as const

export type CausseColor = typeof CAUSSE_COLORS[number]

export const VOICE_TONES = [
  {
    id: "expert",
    label: "Expert & Autorité",
    description: "Positionne la marque comme référence incontestable du secteur",
    icon: "🎓",
    keywords: ["analytique", "précis", "data-driven", "professionnel"],
  },
  {
    id: "bienveillant",
    label: "Bienveillant & Empathique",
    description: "Crée un lien émotionnel profond avec l'audience, chaleureux et humain",
    icon: "🤝",
    keywords: ["humain", "chaleureux", "à l'écoute", "engagé"],
  },
  {
    id: "inspirant",
    label: "Inspirant & Motivant",
    description: "Pousse l'audience à l'action et à se dépasser, visionnaire",
    icon: "🚀",
    keywords: ["visionnaire", "ambitieux", "transformateur", "engagé"],
  },
  {
    id: "ludique",
    label: "Ludique & Créatif",
    description: "Marque mémorable grâce à l'humour et la créativité disruptive",
    icon: "🎨",
    keywords: ["créatif", "fun", "inattendu", "mémorable"],
  },
  {
    id: "premium",
    label: "Premium & Élégant",
    description: "Chaque mot reflète l'exclusivité et la qualité supérieure",
    icon: "💎",
    keywords: ["exclusif", "raffiné", "sobre", "prestige"],
  },
  {
    id: "direct",
    label: "Direct & Percutant",
    description: "Va à l'essentiel, sans fioritures. Chaque mot compte.",
    icon: "⚡",
    keywords: ["concis", "impactant", "clair", "efficace"],
  },
] as const

export type VoiceTone = typeof VOICE_TONES[number]

export const brandDnaFormSchema = z.object({
  // Identité
  brandName: z.string().min(1, "Le nom de la marque est requis").max(100),
  tagline: z.string().max(150).optional(),
  sector: z.string().min(1, "Le secteur est requis"),
  positioning: z.string().min(10, "Décrivez le positionnement (min 10 caractères)").max(500),

  // Logo
  logoDataUrl: z.string().optional(),
  logoFileName: z.string().optional(),

  // Palette couleurs (3 couleurs Causse)
  colorPrimary: z.string().min(1, "Choisissez la couleur principale"),
  colorSecondary: z.string().min(1, "Choisissez la couleur secondaire"),
  colorAccent: z.string().min(1, "Choisissez la couleur d'accent"),

  // Ton de voix
  voiceTone: z.string().min(1, "Choisissez le ton de voix"),

  // Objectif cognitif — driver des styles visuels (CLAUDE.md §2.2)
  objectifCognitif: z.string().optional(),

  // Culture cible
  primaryCulture: z.string().optional(),

  // Audience
  audienceDescription: z
    .string()
    .min(20, "Décrivez votre audience cible (min 20 caractères)")
    .max(1000),
  audienceAge: z.string().optional(),
  audienceLocation: z.string().optional(),
  audiencePainPoints: z.string().max(500).optional(),
})

export type BrandDnaFormData = z.infer<typeof brandDnaFormSchema>

/**
 * Objectifs cognitifs — moteur de sélection des styles visuels.
 * Source : CLAUDE.md §2.2 règles de décision.
 */
export const COGNITIVE_OBJECTIVES = [
  {
    id: "confiance",
    label: "Confiance & Crédibilité",
    icon: "🏛️",
    description: "Établir l'autorité et rassurer l'audience sur votre fiabilité",
    visualStyles: ["Blueprint", "Scientifique"],
    keywords: ["sécurité", "institution", "expertise", "garantie"],
  },
  {
    id: "urgence",
    label: "Urgence & Action",
    icon: "⚡",
    description: "Déclencher un passage à l'action immédiat chez l'audience",
    visualStyles: ["Machine", "Narratif"],
    keywords: ["CTA", "offre limitée", "maintenant", "opportunité"],
  },
  {
    id: "aspiration",
    label: "Aspiration & Désir",
    icon: "✨",
    description: "Créer un sentiment de désir et projeter l'audience dans le succès",
    visualStyles: ["Carte/Tuile", "Narratif"],
    keywords: ["premium", "lifestyle", "réussite", "transformation"],
  },
  {
    id: "expertise",
    label: "Expertise & Savoir",
    icon: "🎓",
    description: "Démontrer la maîtrise technique et la profondeur d'analyse",
    visualStyles: ["Dashboard", "Stack"],
    keywords: ["data", "analyse", "méthode", "résultats"],
  },
  {
    id: "communaute",
    label: "Communauté & Appartenance",
    icon: "🤝",
    description: "Renforcer le sentiment d'appartenance et la solidarité",
    visualStyles: ["Narratif", "Carte/Tuile"],
    keywords: ["ensemble", "collectif", "partage", "engagement"],
  },
  {
    id: "joie",
    label: "Joie & Légèreté",
    icon: "🎉",
    description: "Générer une émotion positive et mémorable chez l'audience",
    visualStyles: ["Narratif", "Machine"],
    keywords: ["fun", "célébration", "humour", "enthousiasme"],
  },
] as const

export type CognitiveObjective = typeof COGNITIVE_OBJECTIVES[number]

export const CULTURES = [
  { id: "maroc", label: "Maroc", flag: "🇲🇦" },
  { id: "afrique_subsaharienne", label: "Afrique subsaharienne", flag: "🌍" },
  { id: "europe_francophone", label: "Europe francophone", flag: "🇫🇷" },
  { id: "moyen_orient", label: "Moyen-Orient", flag: "🌙" },
  { id: "international", label: "International", flag: "🌐" },
] as const

export type Culture = typeof CULTURES[number]
export type CultureId = Culture["id"]

export const SECTORS = [
  "Finance & Banque",
  "Finance Islamique",
  "Santé & Médical",
  "Tech & SaaS",
  "E-commerce & Retail",
  "Éducation & Formation",
  "Agroalimentaire",
  "Luxe & Mode",
  "Tourisme & Hospitality",
  "Immobilier",
  "Consulting & Conseil",
  "ONG & Social",
  "Sport & Fitness",
  "Beauté & Bien-être",
  "Média & Entertainment",
  "Juridique & Droit",
  "Industrie & BTP",
  "Autre",
] as const

/**
 * Notes culturelles Causse × culture pour chaque couleur.
 * Source : CLAUDE.md Annexe A — causse-matrix.ts
 * Utilisées dans le picker pour enrichir la justification psychologique
 * quand une culture cible est sélectionnée.
 */
export const CULTURE_COLOR_NOTES: Record<string, Partial<Record<string, string>>> = {
  bleu_marine: {
    maroc: "🇲🇦 Très positif au Maroc — évoque Chefchaouen, le ciel et la mer. Couleur de confiance universelle.",
    moyen_orient: "✦ Associé à la sagesse et à la protection dans la culture arabe.",
    europe_francophone: "Couleur préférée des Européens — signal de professionnalisme immédiat.",
  },
  bleu_roi: {
    maroc: "🇲🇦 Positif — code couleur institution et État au Maroc.",
    europe_francophone: "Référence institutionnelle forte (UE, État français).",
    international: "Couleur corporate la plus reconnue à l'échelle mondiale.",
  },
  rouge_passion: {
    maroc: "🇲🇦 IDENTITAIRE FORT — couleur nationale du drapeau marocain. Très puissant mais délicat à doser.",
    moyen_orient: "⚠️ Charge symbolique variable — prudence dans les contextes formels.",
    afrique_subsaharienne: "🌍 Richesse, célébration et vitalité dans les cultures subsahariennes.",
  },
  vert_emeraude: {
    maroc: "🇲🇦 CRITIQUE — couleur de l'Islam, charge symbolique très forte. Obligatoire pour Finance Islamique.",
    moyen_orient: "🌙 Couleur sacrée de l'Islam — signal immédiat de conformité aux valeurs.",
    afrique_subsaharienne: "🌍 Nature, espoir et renouveau — très positif dans toute l'Afrique.",
    international: "Signal écologique et durabilité reconnu mondialement.",
  },
  or_prestige: {
    maroc: "🇲🇦 Artisanat, zellige et patrimoine — ancre dans l'excellence locale.",
    moyen_orient: "✦ Opulence et hospitalité — code luxe dominant dans le Golfe.",
    afrique_subsaharienne: "🌍 Richesse et accomplissement — très positif dans le contexte entrepreneurial.",
  },
  noir_elegance: {
    europe_francophone: "Code luxe parisien — référence mode et haute couture.",
    moyen_orient: "✦ Formalité et prestige dans les contextes business.",
    international: "Code luxe universel — signal d'exclusivité sans frontière culturelle.",
  },
  rose_empathique: {
    maroc: "🇲🇦 Couleur festive (henna) — associée à la célébration et la féminité.",
    europe_francophone: "Code bien-être et tendresse — très efficace dans le secteur beauté.",
  },
  turquoise_innovation: {
    maroc: "🇲🇦 Évoque la mosaïque et le zellige marocain — ancrage culturel fort.",
    moyen_orient: "✦ Couleur des dômes et de l'architecture islamique — très positive.",
  },
}

/**
 * Recommandations Causse par secteur.
 * Sources : CLAUDE.md §2.2 + matrice Causse × secteur × culture.
 *
 * recommended : couleurs à mettre en avant (badge "Recommandé")
 * avoid       : couleurs à déconseiller (badge "Déconseillé" + alternative)
 */
export const SECTOR_COLOR_RULES: Record<string, {
  recommended: string[]
  avoid: string[]
  avoidReason?: string
  avoidAlternative?: string
}> = {
  "Finance & Banque": {
    recommended: ["bleu_marine", "bleu_roi", "or_prestige", "noir_elegance"],
    avoid: ["orange_chaleureux", "rose_empathique", "jaune_optimiste"],
  },
  "Finance Islamique": {
    recommended: ["vert_emeraude", "bleu_marine", "or_prestige"],
    avoid: ["rouge_passion", "rose_empathique"],
    avoidReason: "Symbolisme culturel — le rouge est associé à la passion profane dans ce contexte",
    avoidAlternative: "bordeaux_premium",
  },
  "Santé & Médical": {
    recommended: ["bleu_marine", "bleu_roi", "turquoise_innovation", "vert_emeraude"],
    avoid: ["rouge_passion"],
    avoidReason: "Le rouge augmente la tension artérielle — contre-productif en contexte médical",
    avoidAlternative: "bordeaux_premium",
  },
  "Tech & SaaS": {
    recommended: ["bleu_roi", "violet_creatif", "turquoise_innovation", "noir_elegance"],
    avoid: [],
  },
  "Luxe & Mode": {
    recommended: ["noir_elegance", "or_prestige", "bordeaux_premium", "violet_creatif"],
    avoid: ["orange_chaleureux", "jaune_optimiste"],
    avoidReason: "L'orange et le jaune évoquent l'accessibilité — incompatible avec le positionnement luxe",
  },
  "Éducation & Formation": {
    recommended: ["bleu_roi", "jaune_optimiste", "vert_emeraude", "orange_chaleureux"],
    avoid: ["noir_elegance", "bordeaux_premium"],
  },
  "Agroalimentaire": {
    recommended: ["vert_emeraude", "orange_chaleureux", "rouge_passion", "or_prestige"],
    avoid: ["noir_elegance", "violet_creatif"],
  },
  "ONG & Social": {
    recommended: ["vert_emeraude", "bleu_marine", "orange_chaleureux", "rose_empathique"],
    avoid: ["noir_elegance", "or_prestige"],
    avoidReason: "Le noir et l'or évoquent le luxe — en opposition avec les valeurs associatives",
  },
  "Sport & Fitness": {
    recommended: ["rouge_passion", "orange_chaleureux", "noir_elegance", "bleu_roi"],
    avoid: ["rose_empathique", "violet_creatif"],
  },
  "Beauté & Bien-être": {
    recommended: ["rose_empathique", "violet_creatif", "or_prestige", "turquoise_innovation"],
    avoid: [],
  },
  "Juridique & Droit": {
    recommended: ["bleu_marine", "bordeaux_premium", "noir_elegance", "or_prestige"],
    avoid: ["orange_chaleureux", "jaune_optimiste", "rouge_passion"],
    avoidReason: "Ces couleurs évoquent l'impulsivité — contraire à la rigueur juridique",
  },
}
