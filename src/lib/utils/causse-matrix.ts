// ============================================================
// Matrice Causse — Couleur × Émotion × Culture × Secteur
// Référence : Michel Causse — "Couleur & Émotion"
// ============================================================

export interface CausseColor {
  name: string
  hex_primary: string
  hex_variants?: Record<string, string>
  emotions: string[]
  physiological_effects: string
  networks_optimal: string[]
  avoid_sectors?: string[]
  sectors_recommended?: string[]
  culture_maroc: string
  culture_afrique?: string
  culture_europe?: string
  culture_moyen_orient?: string
  causse_quote: string
}

export const CAUSSE_COLOR_MATRIX: Record<string, CausseColor> = {
  rouge: {
    name: 'Rouge',
    hex_primary: '#DC2626',
    hex_variants: {
      bordeaux: '#8B0000',
      corail: '#FF6B6B',
      framboise: '#C41E3A',
    },
    emotions: ['urgence', 'passion', 'énergie', 'danger', 'amour'],
    physiological_effects: 'Augmente la pression artérielle et le rythme cardiaque',
    networks_optimal: ['instagram', 'tiktok', 'youtube'],
    avoid_sectors: ['santé', 'finance_islamique'],
    culture_maroc: 'Identitaire fort — couleur nationale, valorisé',
    culture_afrique: 'Richesse et célébration',
    culture_europe: 'Danger, amour, urgence',
    culture_moyen_orient: 'Danger — utiliser bordeaux à la place',
    causse_quote: 'Le rouge augmente la pression artérielle et le rythme cardiaque',
  },
  bleu: {
    name: 'Bleu',
    hex_primary: '#1D4ED8',
    hex_variants: {
      bleu_nuit: '#1E3A8A',
      bleu_ciel: '#7DD3FC',
      bleu_roi: '#1D4ED8',
      marine: '#0F172A',
    },
    emotions: ['confiance', 'sécurité', 'professionnalisme', 'sérénité', 'loyauté'],
    physiological_effects: 'Abaisse la pression artérielle, favorise la concentration',
    networks_optimal: ['linkedin', 'youtube', 'facebook'],
    sectors_recommended: ['finance', 'tech', 'santé', 'assurance', 'éducation'],
    culture_maroc: 'Très positif — Chefchaouen, ciel, eau',
    culture_afrique: 'Institution, confiance, légitimité',
    culture_europe: 'Couleur préférée — confiance maximale',
    culture_moyen_orient: 'Sérénité, eau, divin',
    causse_quote: 'Couleur préférée dans la majorité des cultures mondiales',
  },
  vert: {
    name: 'Vert',
    hex_primary: '#16A34A',
    hex_variants: {
      emeraude: '#10B981',
      sauge: '#84CC16',
      foret: '#166534',
      nature: '#22C55E',
    },
    emotions: ['croissance', 'santé', 'espoir', 'équilibre', 'nature', 'prospérité'],
    physiological_effects: 'Réduit la fatigue visuelle, augmente la créativité',
    networks_optimal: ['linkedin', 'instagram', 'facebook'],
    sectors_recommended: ['finance_responsable', 'santé', 'agro', 'islam', 'bio', 'nature'],
    culture_maroc: 'CRITIQUE — couleur de l\'Islam, charge symbolique forte, incontournable',
    culture_afrique: 'Nature, fertilité, espoir',
    culture_europe: 'Nature, bio, croissance',
    culture_moyen_orient: 'Sacré — Islam, paradis, obligatoire dans finance islamique',
    causse_quote: 'Dans un bureau, le vert augmente la créativité',
  },
  jaune: {
    name: 'Jaune',
    hex_primary: '#EAB308',
    hex_variants: {
      or: '#F59E0B',
      citron: '#FACC15',
      dore: '#D97706',
    },
    emotions: ['optimisme', 'joie', 'créativité', 'attention', 'chaleur'],
    physiological_effects: 'Stimule le système nerveux, première couleur perçue par l\'œil',
    networks_optimal: ['instagram', 'tiktok', 'youtube'],
    avoid_sectors: ['luxe', 'finance', 'santé_mentale'],
    culture_maroc: 'Festivité, mariage, richesse — usage contextuel',
    culture_afrique: 'Royauté, richesse (or)',
    culture_europe: 'Optimisme, été, énergie',
    culture_moyen_orient: 'Festivité, or, générosité',
    causse_quote: 'Premier couleur perçue par l\'œil humain — impossible à ignorer',
  },
  violet: {
    name: 'Violet',
    hex_primary: '#7C3AED',
    hex_variants: {
      lavande: '#A78BFA',
      prune: '#5B21B6',
      lilas: '#C4B5FD',
      indigo: '#4F46E5',
    },
    emotions: ['luxe', 'créativité', 'mystère', 'spiritualité', 'ambition'],
    physiological_effects: 'Stimule la créativité et l\'imagination',
    networks_optimal: ['instagram', 'pinterest', 'youtube'],
    sectors_recommended: ['luxe', 'spiritualité', 'créativité', 'beauté', 'tech_premium'],
    culture_maroc: 'Royauté, spiritualité — usage limité mais prestigious',
    culture_afrique: 'Royauté, sagesse',
    culture_europe: 'Luxe, royauté, créativité',
    culture_moyen_orient: 'Mystère, spiritualité, luxe',
    causse_quote: 'Couleur de la créativité et de la transformation',
  },
  orange: {
    name: 'Orange',
    hex_primary: '#EA580C',
    hex_variants: {
      coral: '#FB923C',
      terracotta: '#C2410C',
      peche: '#FDBA74',
    },
    emotions: ['chaleur', 'communauté', 'accessibilité', 'énergie', 'amitié'],
    physiological_effects: 'Stimule l\'appétit et la socialisation',
    networks_optimal: ['instagram', 'facebook', 'youtube'],
    sectors_recommended: ['food', 'communautaire', 'sport', 'e-commerce'],
    culture_maroc: 'Chaleur, hospitalité, tajine — très positif',
    culture_afrique: 'Énergie, festif, communauté',
    culture_europe: 'Accessible, chaleureux, fun',
    culture_moyen_orient: 'Chaleur, hospitalité',
    causse_quote: 'L\'orange combine l\'énergie du rouge et la joie du jaune',
  },
  noir: {
    name: 'Noir',
    hex_primary: '#0A0A0F',
    hex_variants: {
      anthracite: '#1F2937',
      charbon: '#111827',
      jais: '#000000',
    },
    emotions: ['luxe', 'élégance', 'puissance', 'sophistication', 'mystère'],
    physiological_effects: 'Crée un sentiment d\'autorité et de prestige',
    networks_optimal: ['instagram', 'linkedin', 'pinterest'],
    sectors_recommended: ['luxe', 'mode', 'tech_premium', 'finance_premium'],
    culture_maroc: 'Élégance — deuil si exclusif, luxe si combiné avec or',
    culture_afrique: 'Puissance, autorité — usage contextualisé',
    culture_europe: 'Luxe, élégance, sophistication',
    culture_moyen_orient: 'Écriture, formalité, deuil — combiner avec or',
    causse_quote: 'L\'absence de couleur qui valorise toutes les autres',
  },
  blanc: {
    name: 'Blanc',
    hex_primary: '#FFFFFF',
    hex_variants: {
      creme: '#FFFBEB',
      ivoire: '#FEFCE8',
      perle: '#F8FAFC',
    },
    emotions: ['pureté', 'clarté', 'minimalisme', 'propreté', 'espace'],
    physiological_effects: 'Crée une sensation d\'espace et de propreté',
    networks_optimal: ['instagram', 'pinterest', 'linkedin'],
    sectors_recommended: ['santé', 'tech', 'luxe_minimaliste', 'beauté'],
    culture_maroc: 'Pureté, Islam, jeunesse — très positif',
    culture_afrique: 'Pureté, deuil selon sous-culture — contexte crucial',
    culture_europe: 'Pureté, minimalisme, luxe discret',
    culture_moyen_orient: 'Pureté islamique, paix, espace',
    causse_quote: 'Le blanc est la couleur de toutes les possibilités',
  },
}

// Mapping : objectif cognitif → couleurs recommandées
export const COGNITIVE_TO_COLORS: Record<string, { primary: string[]; secondary: string[]; avoid: string[] }> = {
  confiance: {
    primary: ['bleu', 'bleu_nuit', 'bleu_roi'],
    secondary: ['blanc', 'gris_anthracite', 'vert'],
    avoid: ['rouge', 'orange_vif', 'jaune_fluo'],
  },
  urgence: {
    primary: ['rouge', 'orange', 'jaune'],
    secondary: ['noir', 'blanc'],
    avoid: ['bleu_pastel', 'vert_doux', 'violet_pale'],
  },
  aspiration: {
    primary: ['violet', 'or', 'noir'],
    secondary: ['blanc_casse', 'bordeaux'],
    avoid: ['jaune_fluo', 'orange_vif'],
  },
  expertise: {
    primary: ['bleu', 'noir', 'bordeaux'],
    secondary: ['or', 'blanc', 'gris'],
    avoid: ['jaune', 'rose_bonbon', 'orange_vif'],
  },
  communaute: {
    primary: ['orange', 'orange_chaleureux', 'rose_terracotta'],
    secondary: ['vert_sauge', 'creme'],
    avoid: ['noir_pur', 'bordeaux_fonce'],
  },
  joie: {
    primary: ['jaune', 'orange', 'rose_vif'],
    secondary: ['turquoise', 'corail'],
    avoid: ['noir', 'gris_froid'],
  },
  serenite: {
    primary: ['bleu_ciel', 'vert_sauge', 'lavande'],
    secondary: ['blanc', 'creme'],
    avoid: ['rouge', 'orange_vif', 'jaune_fluo'],
  },
  croissance: {
    primary: ['vert', 'turquoise', 'bleu'],
    secondary: ['blanc', 'or'],
    avoid: ['rouge', 'violet_sombre'],
  },
  creativite: {
    primary: ['violet', 'orange_coral', 'bleu_electrique'],
    secondary: ['blanc', 'jaune_doux'],
    avoid: ['marron', 'gris_souris'],
  },
}

// Formes Gestalt → signal psychologique
export const GESTALT_SHAPES = {
  cercle: {
    signal: 'Communauté, unité, protection, infinité',
    prompt_keywords: 'circular composition, rounded forms, flowing curves, unity',
    sectors: ['santé', 'bien-être', 'communautaire', 'social'],
  },
  carre: {
    signal: 'Stabilité, honnêteté, ordre, fiabilité',
    prompt_keywords: 'geometric blocks, structured grid, architectural lines, balanced composition',
    sectors: ['finance', 'b2b', 'institutions', 'logistique'],
  },
  triangle: {
    signal: 'Ambition, performance, hiérarchie, direction',
    prompt_keywords: 'triangular forms, upward direction, ascending lines, dynamic peaks',
    sectors: ['startups', 'sport', 'leadership', 'consulting'],
  },
  diagonales: {
    signal: 'Dynamisme, vitesse, rupture, innovation',
    prompt_keywords: 'diagonal lines, motion blur, dynamic angles, speed lines',
    sectors: ['tech', 'sport', 'transformation', 'énergie'],
  },
  courbes: {
    signal: 'Élégance, fluidité, naturel, douceur',
    prompt_keywords: 'organic curves, flowing lines, natural movement, smooth transitions',
    sectors: ['luxe', 'beauté', 'bio', 'art'],
  },
  grille: {
    signal: 'Clarté, organisation, expertise, modernité',
    prompt_keywords: 'grid layout, data visualization, clean structure, systematic arrangement',
    sectors: ['tech', 'data', 'finance', 'médical'],
  },
}

/**
 * Obtient les HEX primaires recommandées pour un objectif cognitif + secteur
 */
export function getRecommendedColors(
  cognitiveObjective: string,
  sector: string,
  existingPalette?: string[]
): string[] {
  // Si une palette Brand DNA existe déjà, la prioriser
  if (existingPalette && existingPalette.length > 0) {
    return existingPalette.slice(0, 3)
  }

  const mapping = COGNITIVE_TO_COLORS[cognitiveObjective]
  if (!mapping) {
    return [CAUSSE_COLOR_MATRIX.bleu.hex_primary, CAUSSE_COLOR_MATRIX.blanc.hex_primary]
  }

  // Override sectoriel critique
  if (sector === 'finance_islamique') {
    return [CAUSSE_COLOR_MATRIX.vert.hex_primary, CAUSSE_COLOR_MATRIX.blanc.hex_primary]
  }
  if (sector === 'santé' && mapping.primary.includes('rouge')) {
    const filtered = mapping.primary.filter((c) => c !== 'rouge')
    filtered.unshift('bleu')
    return filtered
      .map((name) => CAUSSE_COLOR_MATRIX[name]?.hex_primary)
      .filter(Boolean) as string[]
  }

  return mapping.primary
    .map((name) => CAUSSE_COLOR_MATRIX[name]?.hex_primary)
    .filter(Boolean) as string[]
}
