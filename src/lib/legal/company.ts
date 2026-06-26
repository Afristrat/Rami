// ============================================================
// Source unique de vérité — informations légales de l'éditeur RAMI.
// Données vérifiées (bulletin officiel DGI Maroc). NE PAS dupliquer ailleurs :
// toutes les pages légales importent cet objet pour garantir la cohérence.
// ============================================================

/** Date de dernière mise à jour des documents légaux (affichée partout). */
export const LAST_UPDATED = "26 juin 2026" as const

/** Informations sur la société éditrice et son hébergement. */
export const COMPANY = {
  // Identité
  raisonSociale: "AIMPOWER",
  marqueCommerciale: "AI-MPower",
  produit: "RAMI",
  formeJuridique: "SARL à Associé Unique",
  capitalSocial: "10 000 MAD",

  // Identifiants légaux et fiscaux (Maroc)
  rc: "618105 — Casablanca",
  ice: "003438689000014",
  if: "60276299",
  taxeProfessionnelle: "34209790",

  // Siège
  siege:
    "32 Rue Al Banafsaj, Résidence Zitouna, Étage 2, N°21, c/o Ailleurs Shift and Scale, Casablanca, Maroc",

  // Personnes
  gerant: "Med Amine Mansouri Idrissi",
  directeurPublication: "Med Amine Mansouri Idrissi",

  // Contacts
  emailContact: "contact@ai-mpower.com",
  emailDpo: "privacy@ai-mpower.com",
  /** Numéro de téléphone non communiqué — ne pas inventer. */
  telephone: null as string | null,

  // Hébergement
  hebergeur:
    "Auto-hébergé par AIMPOWER SARL-AU sur infrastructure dédiée (serveur géré en propre), Maroc. Diffusion via le réseau Cloudflare, Inc. (CDN/proxy).",

  // CNDP — Maroc (loi 09-08)
  cndpRecepisse: "Déclaration CNDP en cours de dépôt",

  // Site
  siteUrl: "https://rami-os.com",

  // Activité
  activite:
    "Conseil de gestion ; édition de la plateforme SaaS RAMI (gestion et génération de contenu social media)",
} as const

export type Company = typeof COMPANY
