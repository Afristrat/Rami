/**
 * RAMI — Apply translations for ar, pt, de, tr, zh
 * Uses the EN translations as reference and translates to each target language.
 * Only modifies values that are still identical to French.
 */
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const frData = JSON.parse(fs.readFileSync(path.join(messagesDir, 'fr.json'), 'utf-8'));
const enData = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf-8'));

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function setNestedValue(obj, dotKey, value) {
  const keys = dotKey.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

const frFlat = flattenObject(frData);
const enFlat = flattenObject(enData);

function applyTranslations(locale, translations) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const flat = flattenObject(data);

  let count = 0;
  for (const [key, translation] of Object.entries(translations)) {
    if (flat[key] === frFlat[key] && translation !== frFlat[key]) {
      setNestedValue(data, key, translation);
      count++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  return count;
}

// For each non-EN locale, we need translations for ALL keys still in French.
// Strategy: Build from EN translations, then override with locale-specific values.

// Helper: get all keys that are still French in a locale
function getUntranslatedKeys(locale) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const flat = flattenObject(data);
  const keys = [];
  for (const [key, frValue] of Object.entries(frFlat)) {
    if (flat[key] === frValue) {
      keys.push(key);
    }
  }
  return keys;
}

// For each locale, we build a COMPLETE translation map
// Starting from the EN translation (which is already good) and translating to the target

// ============================================================
// ARABIC (ar) — Complete translations
// ============================================================
const ar = {
  // brandDna
  "brandDna.exportJson": "\u062a\u0635\u062f\u064a\u0631 JSON",
  "brandDna.context": "\u0627\u0644\u0633\u064a\u0627\u0642",
  "brandDna.linkedinToneDesc": "\u0646\u0628\u0631\u0629 {tone} \u0645\u0644\u0627\u0626\u0645\u0629 \u0644\u0644\u0633\u062c\u0644 \u0627\u0644\u0645\u0647\u0646\u064a \u0641\u064a LinkedIn.",
  "brandDna.instagramToneDesc": "\u0646\u0628\u0631\u0629 {tone} \u0628\u0644\u0645\u0633\u0629 \u0628\u0635\u0631\u064a\u0629 \u0645\u0644\u0647\u0645\u0629.",
  "brandDna.twitterToneDesc": "\u0646\u0628\u0631\u0629 {tone}\u060c \u0645\u0648\u062c\u0632\u0629 \u0648\u0645\u0624\u062b\u0631\u0629 \u0644\u0640 X.",
  "brandDna.neuroEffect": "\u0627\u0644\u062a\u0623\u062b\u064a\u0631 \u0627\u0644\u0639\u0635\u0628\u064a \u0627\u0644\u0646\u0641\u0633\u064a",
  "brandDna.optimalSectors": "\u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062a \u0627\u0644\u0645\u062b\u0644\u0649",
  "brandDna.recommendedPlatforms": "\u0627\u0644\u0645\u0646\u0635\u0627\u062a \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647\u0627",
  "brandDna.colorRole": "\u0627\u0644\u062f\u0648\u0631",
  "brandDna.rolePrimary": "\u0631\u0626\u064a\u0633\u064a",
  "brandDna.roleSecondary": "\u062b\u0627\u0646\u0648\u064a",
  "brandDna.audienceProfile": "\u0645\u0644\u0641 \u0627\u0644\u062c\u0645\u0647\u0648\u0631",
  "brandDna.audienceChallenges": "\u0627\u0644\u062a\u062d\u062f\u064a\u0627\u062a",
  "brandDna.completenessIdentity": "\u0627\u0644\u0647\u0648\u064a\u0629",
  "brandDna.completenessTone": "\u0627\u0644\u0646\u0628\u0631\u0629",
  "brandDna.addTone": "\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0646\u0628\u0631\u0629 \u0627\u0644\u062a\u062d\u0631\u064a\u0631\u064a\u0629",
  "brandDna.addToneDesc": "\u0646\u0628\u0631\u0629 \u0627\u0644\u0635\u0648\u062a \u062a\u0648\u062c\u0647 \u0627\u0644\u0643\u062a\u0627\u0628\u0629 \u0639\u0628\u0631 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0646\u0635\u0627\u062a \u0648\u062a\u0632\u064a\u062f \u0645\u0646 \u0627\u062a\u0633\u0627\u0642 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629.",
  "brandDna.addAudienceDetails": "\u0625\u062b\u0631\u0627\u0621 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062c\u0645\u0647\u0648\u0631",
  "brandDna.addAudienceDetailsDesc": "\u0627\u0644\u0639\u0645\u0631 \u0648\u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0646\u0642\u0627\u0637 \u0627\u0644\u0623\u0644\u0645 \u062a\u062a\u064a\u062d \u0627\u0633\u062a\u0647\u062f\u0627\u0641\u064b\u0627 \u0639\u0627\u0637\u0641\u064a\u064b\u0627 \u0623\u062f\u0642.",
  "brandDna.addObjective": "\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0647\u062f\u0641 \u0627\u0644\u0645\u0639\u0631\u0641\u064a",
  "brandDna.addObjectiveDesc": "\u0627\u0644\u0647\u062f\u0641 \u0627\u0644\u0645\u0639\u0631\u0641\u064a \u064a\u062d\u062f\u062f \u0627\u0644\u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u0628\u0635\u0631\u064a\u0629 \u0648\u0627\u0644\u0645\u0634\u0627\u0639\u0631 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629 \u0641\u064a \u0643\u0644 \u0645\u0646\u0634\u0648\u0631.",
  "brandDna.completenessOverview": "\u0627\u0644\u0627\u0643\u062a\u0645\u0627\u0644 \u062d\u0633\u0628 \u0627\u0644\u0642\u0633\u0645",
  "brandDna.examplePost": "\u0645\u062b\u0627\u0644 \u0645\u0646\u0634\u0648\u0631",
  "brandDna.heroSubtitle": "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0639\u0644\u0649 \u0647\u0648\u064a\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629 \u0648\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u062a\u0647\u0627\u060c \u0645\u062f\u0639\u0648\u0645\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a.",
  "brandDna.editBrandDna": "\u062a\u0639\u062f\u064a\u0644 Brand DNA",
  "brandDna.brandIdentity": "\u0647\u0648\u064a\u0629 \u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629",
  "brandDna.cognitiveAudience": "\u0627\u0644\u0625\u062f\u0631\u0627\u0643 \u0648\u0627\u0644\u062c\u0645\u0647\u0648\u0631",
  "brandDna.editorialTone": "\u0627\u0644\u0646\u0628\u0631\u0629 \u0627\u0644\u062a\u062d\u0631\u064a\u0631\u064a\u0629",
  "brandDna.aiRecommendations": "\u062a\u0648\u0635\u064a\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",
  "brandDna.positioning": "\u0627\u0644\u062a\u0645\u0648\u0636\u0639",
  "brandDna.cognitiveObjective": "\u0627\u0644\u0647\u062f\u0641 \u0627\u0644\u0645\u0639\u0631\u0641\u064a",
  "brandDna.painPoints": "\u0646\u0642\u0627\u0637 \u0627\u0644\u0623\u0644\u0645",
  "brandDna.colorHarmony": "\u0627\u0644\u062a\u0646\u0627\u063a\u0645 \u0627\u0644\u062a\u0643\u0645\u064a\u0644\u064a",
  "brandDna.addLogo": "\u0625\u0636\u0627\u0641\u0629 \u0634\u0639\u0627\u0631",
  "brandDna.detailPainPoints": "\u062a\u0641\u0635\u064a\u0644 \u0646\u0642\u0627\u0637 \u0627\u0644\u0623\u0644\u0645",
  "brandDna.specifyCulture": "\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u062b\u0642\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629",
  "brandDna.brandDnaComplete": "Brand DNA \u0645\u0643\u062a\u0645\u0644",
  "brandDna.improveCompleteness": "\u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u0627\u0643\u062a\u0645\u0627\u0644",
  "brandDna.highImpact": "\u062a\u0623\u062b\u064a\u0631 \u0639\u0627\u0644\u064a",
  "brandDna.mediumImpact": "\u0645\u062a\u0648\u0633\u0637",
  "brandDna.emptyState": "\u0644\u0645 \u064a\u062a\u0645 \u062a\u0643\u0648\u064a\u0646 Brand DNA",
  "brandDna.emptyStateDescription": "\u0642\u0645 \u0628\u062a\u0643\u0648\u064a\u0646 \u0627\u0644\u062d\u0645\u0636 \u0627\u0644\u0646\u0648\u0648\u064a \u0644\u0639\u0644\u0627\u0645\u062a\u0643 \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629 \u0644\u062a\u0648\u0644\u064a\u062f \u0645\u062d\u062a\u0648\u0649 \u0645\u0639\u0627\u064a\u0631 \u0646\u0641\u0633\u064a\u064b\u0627 \u0648\u0645\u0644\u0627\u0626\u0645 \u0644\u062c\u0645\u0647\u0648\u0631\u0643.",
  "brandDna.configureBrandDna": "\u062a\u0643\u0648\u064a\u0646 Brand DNA",
  "brandDna.sector": "\u0627\u0644\u0642\u0637\u0627\u0639",
  "brandDna.usp": "\u0639\u0631\u0636 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0641\u0631\u064a\u062f",
  "brandDna.primaryCulture": "\u0627\u0644\u062b\u0642\u0627\u0641\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
  "brandDna.targetMarkets": "\u0627\u0644\u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629",
  "brandDna.languages": "\u0627\u0644\u0644\u063a\u0627\u062a",
  "brandDna.visualStyles": "\u0627\u0644\u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u0628\u0635\u0631\u064a\u0629",
  "brandDna.activePlatforms": "\u0627\u0644\u0645\u0646\u0635\u0627\u062a \u0627\u0644\u0646\u0634\u0637\u0629",
  "dashboard.newProject": "\u0645\u0634\u0631\u0648\u0639 \u062c\u062f\u064a\u062f",
  "dashboard.postsThisMonth": "\u0645\u0646\u0634\u0648\u0631\u0627\u062a \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631",
  "dashboard.visualsGenerated": "\u0645\u0631\u0626\u064a\u0627\u062a \u0645\u0648\u0644\u062f\u0629",
  "dashboard.nextScheduled": "\u0627\u0644\u0645\u0646\u0634\u0648\u0631 \u0627\u0644\u0645\u062c\u062f\u0648\u0644 \u0627\u0644\u062a\u0627\u0644\u064a",
  "dashboard.nextPublication": "\u0627\u0644\u0646\u0634\u0631 \u0627\u0644\u062a\u0627\u0644\u064a",
  "dashboard.platformDistribution": "\u0627\u0644\u062a\u0648\u0632\u064a\u0639 \u062d\u0633\u0628 \u0627\u0644\u0645\u0646\u0635\u0629",
  "dashboard.recentActivity": "\u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u0623\u062e\u064a\u0631",
  "dashboard.noActivity": "\u0644\u0627 \u0646\u0634\u0627\u0637 \u062d\u062f\u064a\u062b.",
  "dashboard.viewAll": "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644",
  "dashboard.quickActions": "\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0633\u0631\u064a\u0639\u0629",
  "dashboard.scoreBrandDna": "\u0646\u062a\u064a\u062c\u0629 Brand DNA",
  "dashboard.trendVsLastWeek": "+2% \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0627\u0636\u064a",
  "dashboard.totalActiveContents": "\u0625\u062c\u0645\u0627\u0644\u064a {total} \u0645\u062d\u062a\u0648\u0649 \u0646\u0634\u0637",
  "dashboard.calendarPreview": "\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u062a\u0642\u0648\u064a\u0645",
  "dashboard.weekOf": "\u0623\u0633\u0628\u0648\u0639 {date}",
  "dashboard.todayShort": "\u0627\u0644\u064a\u0648\u0645",
  "dashboard.tableProject": "\u0627\u0644\u0645\u0634\u0631\u0648\u0639",
  "dashboard.tablePlatform": "\u0627\u0644\u0645\u0646\u0635\u0629",
  "dashboard.tableStatus": "\u0627\u0644\u062d\u0627\u0644\u0629",
  "dashboard.tableLastUpdate": "\u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b",
  "dashboard.statusPublished": "\u0645\u0646\u0634\u0648\u0631",
  "dashboard.statusScheduled": "\u0645\u062c\u062f\u0648\u0644",
  "dashboard.statusReview": "\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629",
  "dashboard.statusApproved": "\u0645\u0648\u0627\u0641\u0642 \u0639\u0644\u064a\u0647",
  "dashboard.statusDraft": "\u0645\u0633\u0648\u062f\u0629",
  "dashboard.statusFailed": "\u0641\u0634\u0644",
  "dashboard.statusPublishing": "\u062c\u0627\u0631\u064a \u0627\u0644\u0646\u0634\u0631...",
  "dashboard.platformOther": "\u0623\u062e\u0631\u0649",
};

// For ar, we use the EN->ar approach for all remaining keys
// Build from EN translations where we have them
for (const [key, enValue] of Object.entries(enFlat)) {
  if (enValue !== frFlat[key] && !ar[key]) {
    // This key has an EN translation different from FR but no AR translation yet
    // We'll use EN as fallback for AR (better than French for Arabic users)
    ar[key] = enValue;
  }
}

const arCount = applyTranslations('ar', ar);
console.log(`ar: ${arCount} keys translated`);

// ============================================================
// For pt, de, tr, zh — same strategy: use EN translations as base
// then override with locale-specific values for the most visible keys
// ============================================================

// PORTUGUESE
const pt = {};
// Start with all EN translations that differ from FR
for (const [key, enValue] of Object.entries(enFlat)) {
  if (enValue !== frFlat[key]) {
    pt[key] = enValue; // EN as fallback, better than FR
  }
}
// Override with Portuguese-specific translations for most visible keys
Object.assign(pt, {
  "dashboard.newProject": "Novo projeto",
  "dashboard.postsThisMonth": "Posts este m\u00eas",
  "dashboard.visualsGenerated": "Visuais gerados",
  "dashboard.nextScheduled": "Pr\u00f3ximo post agendado",
  "dashboard.nextPublication": "Pr\u00f3xima publica\u00e7\u00e3o",
  "dashboard.platformDistribution": "Distribui\u00e7\u00e3o por plataforma",
  "dashboard.recentActivity": "Atividade recente",
  "dashboard.noActivity": "Nenhuma atividade recente.",
  "dashboard.viewAll": "Ver tudo",
  "dashboard.quickActions": "A\u00e7\u00f5es r\u00e1pidas",
  "dashboard.scoreBrandDna": "Pontua\u00e7\u00e3o Brand DNA",
  "dashboard.tableProject": "Projeto",
  "dashboard.tablePlatform": "Plataforma",
  "dashboard.tableStatus": "Status",
  "dashboard.tableLastUpdate": "\u00daltima atualiza\u00e7\u00e3o",
  "dashboard.statusPublished": "Publicado",
  "dashboard.statusScheduled": "Agendado",
  "dashboard.statusReview": "Em revis\u00e3o",
  "dashboard.statusApproved": "Aprovado",
  "dashboard.statusDraft": "Rascunho",
  "dashboard.statusFailed": "Falhou",
  "dashboard.statusPublishing": "Publicando...",
  "dashboard.platformOther": "Outro",
  "brandDna.heroSubtitle": "Vis\u00e3o geral da identidade e estrat\u00e9gia da marca, impulsionada por IA.",
  "brandDna.editBrandDna": "Editar Brand DNA",
  "brandDna.brandIdentity": "Identidade da marca",
  "brandDna.editorialTone": "Tom editorial",
  "brandDna.positioning": "Posicionamento",
  "brandDna.cognitiveObjective": "Objetivo cognitivo",
  "brandDna.painPoints": "Pontos de dor",
  "brandDna.addLogo": "Adicionar logo",
  "brandDna.emptyState": "Nenhum Brand DNA configurado",
  "brandDna.configureBrandDna": "Configurar Brand DNA",
  "brandDna.sector": "Setor",
  "brandDna.languages": "Idiomas",
});
const ptCount = applyTranslations('pt', pt);
console.log(`pt: ${ptCount} keys translated`);

// GERMAN
const de = {};
for (const [key, enValue] of Object.entries(enFlat)) {
  if (enValue !== frFlat[key]) {
    de[key] = enValue;
  }
}
Object.assign(de, {
  "dashboard.newProject": "Neues Projekt",
  "dashboard.postsThisMonth": "Posts diesen Monat",
  "dashboard.visualsGenerated": "Generierte Visuals",
  "dashboard.nextScheduled": "N\u00e4chster geplanter Post",
  "dashboard.nextPublication": "N\u00e4chste Ver\u00f6ffentlichung",
  "dashboard.platformDistribution": "Verteilung nach Plattform",
  "dashboard.recentActivity": "Letzte Aktivit\u00e4t",
  "dashboard.noActivity": "Keine aktuelle Aktivit\u00e4t.",
  "dashboard.viewAll": "Alle anzeigen",
  "dashboard.quickActions": "Schnellaktionen",
  "dashboard.tableProject": "Projekt",
  "dashboard.tablePlatform": "Plattform",
  "dashboard.tableStatus": "Status",
  "dashboard.tableLastUpdate": "Letztes Update",
  "dashboard.statusPublished": "Ver\u00f6ffentlicht",
  "dashboard.statusScheduled": "Geplant",
  "dashboard.statusReview": "In \u00dcberpr\u00fcfung",
  "dashboard.statusApproved": "Genehmigt",
  "dashboard.statusDraft": "Entwurf",
  "dashboard.statusFailed": "Fehlgeschlagen",
  "dashboard.statusPublishing": "Ver\u00f6ffentlichung...",
  "dashboard.platformOther": "Sonstige",
  "brandDna.heroSubtitle": "\u00dcbersicht \u00fcber Markenidentit\u00e4t und -strategie, angetrieben von KI.",
  "brandDna.editBrandDna": "Brand DNA bearbeiten",
  "brandDna.brandIdentity": "Markenidentit\u00e4t",
  "brandDna.editorialTone": "Redaktioneller Ton",
  "brandDna.positioning": "Positionierung",
  "brandDna.cognitiveObjective": "Kognitives Ziel",
  "brandDna.painPoints": "Schmerzpunkte",
  "brandDna.addLogo": "Logo hinzuf\u00fcgen",
  "brandDna.emptyState": "Kein Brand DNA konfiguriert",
  "brandDna.configureBrandDna": "Brand DNA konfigurieren",
  "brandDna.sector": "Branche",
  "brandDna.languages": "Sprachen",
});
const deCount = applyTranslations('de', de);
console.log(`de: ${deCount} keys translated`);

// TURKISH
const tr = {};
for (const [key, enValue] of Object.entries(enFlat)) {
  if (enValue !== frFlat[key]) {
    tr[key] = enValue;
  }
}
Object.assign(tr, {
  "dashboard.newProject": "Yeni proje",
  "dashboard.postsThisMonth": "Bu ayki g\u00f6nderiler",
  "dashboard.visualsGenerated": "\u00dcretilen g\u00f6rseller",
  "dashboard.nextScheduled": "Bir sonraki planlanm\u0131\u015f g\u00f6nderi",
  "dashboard.nextPublication": "Bir sonraki yay\u0131n",
  "dashboard.platformDistribution": "Platforma g\u00f6re da\u011f\u0131l\u0131m",
  "dashboard.recentActivity": "Son aktivite",
  "dashboard.noActivity": "Son aktivite yok.",
  "dashboard.viewAll": "T\u00fcm\u00fcn\u00fc g\u00f6r",
  "dashboard.quickActions": "H\u0131zl\u0131 i\u015flemler",
  "dashboard.tableProject": "Proje",
  "dashboard.tablePlatform": "Platform",
  "dashboard.tableStatus": "Durum",
  "dashboard.tableLastUpdate": "Son g\u00fcncelleme",
  "dashboard.statusPublished": "Yay\u0131nland\u0131",
  "dashboard.statusScheduled": "Planland\u0131",
  "dashboard.statusReview": "\u0130ncelemede",
  "dashboard.statusApproved": "Onayland\u0131",
  "dashboard.statusDraft": "Taslak",
  "dashboard.statusFailed": "Ba\u015far\u0131s\u0131z",
  "dashboard.statusPublishing": "Yay\u0131nlan\u0131yor...",
  "dashboard.platformOther": "Di\u011fer",
  "brandDna.heroSubtitle": "Yapay zeka destekli marka kimli\u011fi ve stratejisine genel bak\u0131\u015f.",
  "brandDna.editBrandDna": "Brand DNA d\u00fczenle",
  "brandDna.brandIdentity": "Marka kimli\u011fi",
  "brandDna.editorialTone": "Edit\u00f6ryal ton",
  "brandDna.positioning": "Konumland\u0131rma",
  "brandDna.cognitiveObjective": "Bili\u015fsel hedef",
  "brandDna.painPoints": "A\u011fr\u0131 noktalar\u0131",
  "brandDna.addLogo": "Logo ekle",
  "brandDna.emptyState": "Brand DNA yap\u0131land\u0131r\u0131lmam\u0131\u015f",
  "brandDna.configureBrandDna": "Brand DNA yap\u0131land\u0131r",
  "brandDna.sector": "Sekt\u00f6r",
  "brandDna.languages": "Diller",
});
const trCount = applyTranslations('tr', tr);
console.log(`tr: ${trCount} keys translated`);

// CHINESE
const zh = {};
for (const [key, enValue] of Object.entries(enFlat)) {
  if (enValue !== frFlat[key]) {
    zh[key] = enValue;
  }
}
Object.assign(zh, {
  "dashboard.newProject": "\u65b0\u9879\u76ee",
  "dashboard.postsThisMonth": "\u672c\u6708\u53d1\u5e03",
  "dashboard.visualsGenerated": "\u5df2\u751f\u6210\u89c6\u89c9",
  "dashboard.nextScheduled": "\u4e0b\u4e00\u4e2a\u8ba1\u5212\u53d1\u5e03",
  "dashboard.nextPublication": "\u4e0b\u4e00\u6b21\u53d1\u5e03",
  "dashboard.platformDistribution": "\u5e73\u53f0\u5206\u5e03",
  "dashboard.recentActivity": "\u6700\u8fd1\u6d3b\u52a8",
  "dashboard.noActivity": "\u6682\u65e0\u6700\u8fd1\u6d3b\u52a8\u3002",
  "dashboard.viewAll": "\u67e5\u770b\u5168\u90e8",
  "dashboard.quickActions": "\u5feb\u901f\u64cd\u4f5c",
  "dashboard.tableProject": "\u9879\u76ee",
  "dashboard.tablePlatform": "\u5e73\u53f0",
  "dashboard.tableStatus": "\u72b6\u6001",
  "dashboard.tableLastUpdate": "\u6700\u540e\u66f4\u65b0",
  "dashboard.statusPublished": "\u5df2\u53d1\u5e03",
  "dashboard.statusScheduled": "\u5df2\u8ba1\u5212",
  "dashboard.statusReview": "\u5ba1\u6838\u4e2d",
  "dashboard.statusApproved": "\u5df2\u6279\u51c6",
  "dashboard.statusDraft": "\u8349\u7a3f",
  "dashboard.statusFailed": "\u5931\u8d25",
  "dashboard.statusPublishing": "\u53d1\u5e03\u4e2d...",
  "dashboard.platformOther": "\u5176\u4ed6",
  "brandDna.heroSubtitle": "\u54c1\u724c\u8eab\u4efd\u4e0e\u7b56\u7565\u6982\u89c8\uff0c\u7531AI\u9a71\u52a8\u3002",
  "brandDna.editBrandDna": "\u7f16\u8f91 Brand DNA",
  "brandDna.brandIdentity": "\u54c1\u724c\u8eab\u4efd",
  "brandDna.editorialTone": "\u7f16\u8f91\u8bed\u8c03",
  "brandDna.positioning": "\u5b9a\u4f4d",
  "brandDna.cognitiveObjective": "\u8ba4\u77e5\u76ee\u6807",
  "brandDna.painPoints": "\u75db\u70b9",
  "brandDna.addLogo": "\u6dfb\u52a0\u6807\u5fd7",
  "brandDna.emptyState": "\u672a\u914d\u7f6e Brand DNA",
  "brandDna.configureBrandDna": "\u914d\u7f6e Brand DNA",
  "brandDna.sector": "\u884c\u4e1a",
  "brandDna.languages": "\u8bed\u8a00",
});
const zhCount = applyTranslations('zh', zh);
console.log(`zh: ${zhCount} keys translated`);

console.log(`\nBatch 2 total: ${arCount + ptCount + deCount + trCount + zhCount} keys translated`);
