// Injection one-off des clés de recommandations IA (dette #2) dans analytics.* des 8 locales.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MSG_DIR = join(__dirname, "..", "messages")

const K = {
  fr: {
    recoBestHour: "Vos posts à {value}h ont le meilleur engagement ({pct}%)",
    recoBestColor: "Les visuels {value} ont le meilleur engagement ({pct}%)",
    recoBestFormat: "Le format {value} génère le meilleur engagement ({pct}%)",
    recoBestPlatform: "{value} est votre plateforme la plus performante ({pct}%)",
    recoBestObjective: "L'objectif « {value} » performe le mieux ({pct}%)",
    recoEmptyTitle: "Pas encore de recommandations",
    recoEmptyDesc: "Publiez et laissez RAMI collecter assez de métriques (≥3 posts par critère) pour des recommandations fondées sur vos données réelles.",
    recoSampleSize: "sur {count} posts mesurés",
  },
  en: {
    recoBestHour: "Your posts at {value}h get the best engagement ({pct}%)",
    recoBestColor: "Visuals {value} get the best engagement ({pct}%)",
    recoBestFormat: "The {value} format drives the best engagement ({pct}%)",
    recoBestPlatform: "{value} is your top-performing platform ({pct}%)",
    recoBestObjective: "The “{value}” objective performs best ({pct}%)",
    recoEmptyTitle: "No recommendations yet",
    recoEmptyDesc: "Publish and let RAMI collect enough metrics (≥3 posts per criterion) for recommendations based on your real data.",
    recoSampleSize: "across {count} measured posts",
  },
  es: {
    recoBestHour: "Tus publicaciones a las {value}h tienen el mejor engagement ({pct}%)",
    recoBestColor: "Los visuales {value} tienen el mejor engagement ({pct}%)",
    recoBestFormat: "El formato {value} genera el mejor engagement ({pct}%)",
    recoBestPlatform: "{value} es tu plataforma con mejor rendimiento ({pct}%)",
    recoBestObjective: "El objetivo «{value}» rinde mejor ({pct}%)",
    recoEmptyTitle: "Aún no hay recomendaciones",
    recoEmptyDesc: "Publica y deja que RAMI recopile suficientes métricas (≥3 posts por criterio) para recomendaciones basadas en tus datos reales.",
    recoSampleSize: "sobre {count} posts medidos",
  },
  de: {
    recoBestHour: "Ihre Beiträge um {value} Uhr erzielen das beste Engagement ({pct}%)",
    recoBestColor: "Visuals {value} erzielen das beste Engagement ({pct}%)",
    recoBestFormat: "Das Format {value} erzielt das beste Engagement ({pct}%)",
    recoBestPlatform: "{value} ist Ihre leistungsstärkste Plattform ({pct}%)",
    recoBestObjective: "Das Ziel „{value}“ schneidet am besten ab ({pct}%)",
    recoEmptyTitle: "Noch keine Empfehlungen",
    recoEmptyDesc: "Veröffentlichen Sie und lassen Sie RAMI genügend Metriken sammeln (≥3 Beiträge pro Kriterium) für Empfehlungen auf Basis Ihrer echten Daten.",
    recoSampleSize: "über {count} gemessene Beiträge",
  },
  pt: {
    recoBestHour: "Suas publicações às {value}h têm o melhor engajamento ({pct}%)",
    recoBestColor: "Os visuais {value} têm o melhor engajamento ({pct}%)",
    recoBestFormat: "O formato {value} gera o melhor engajamento ({pct}%)",
    recoBestPlatform: "{value} é sua plataforma de melhor desempenho ({pct}%)",
    recoBestObjective: "O objetivo «{value}» tem o melhor desempenho ({pct}%)",
    recoEmptyTitle: "Ainda sem recomendações",
    recoEmptyDesc: "Publique e deixe a RAMI coletar métricas suficientes (≥3 posts por critério) para recomendações baseadas nos seus dados reais.",
    recoSampleSize: "em {count} posts medidos",
  },
  tr: {
    recoBestHour: "{value} saatindeki gönderileriniz en iyi etkileşimi alıyor (%{pct})",
    recoBestColor: "{value} görselleri en iyi etkileşimi alıyor (%{pct})",
    recoBestFormat: "{value} formatı en iyi etkileşimi sağlıyor (%{pct})",
    recoBestPlatform: "{value} en iyi performans gösteren platformunuz (%{pct})",
    recoBestObjective: "«{value}» hedefi en iyi performansı gösteriyor (%{pct})",
    recoEmptyTitle: "Henüz öneri yok",
    recoEmptyDesc: "Yayınlayın ve RAMI'nin gerçek verilerinize dayalı öneriler için yeterli metrik toplamasına izin verin (kriter başına ≥3 gönderi).",
    recoSampleSize: "{count} ölçülen gönderi üzerinden",
  },
  ar: {
    recoBestHour: "منشوراتك في الساعة {value} تحقق أفضل تفاعل ({pct}%)",
    recoBestColor: "التصاميم {value} تحقق أفضل تفاعل ({pct}%)",
    recoBestFormat: "صيغة {value} تحقق أفضل تفاعل ({pct}%)",
    recoBestPlatform: "{value} هي منصتك الأفضل أداءً ({pct}%)",
    recoBestObjective: "الهدف «{value}» يحقق الأداء الأفضل ({pct}%)",
    recoEmptyTitle: "لا توجد توصيات بعد",
    recoEmptyDesc: "انشر ودع RAMI يجمع مقاييس كافية (≥3 منشورات لكل معيار) للحصول على توصيات مبنية على بياناتك الحقيقية.",
    recoSampleSize: "من {count} منشورات مُقاسة",
  },
  zh: {
    recoBestHour: "您在 {value} 点的帖子获得最佳互动（{pct}%）",
    recoBestColor: "{value} 视觉素材获得最佳互动（{pct}%）",
    recoBestFormat: "{value} 格式带来最佳互动（{pct}%）",
    recoBestPlatform: "{value} 是您表现最佳的平台（{pct}%）",
    recoBestObjective: "目标「{value}」表现最佳（{pct}%）",
    recoEmptyTitle: "暂无推荐",
    recoEmptyDesc: "发布内容并让 RAMI 收集足够的指标（每项标准 ≥3 篇帖子），以基于您的真实数据提供推荐。",
    recoSampleSize: "基于 {count} 篇已测帖子",
  },
}

for (const [loc, vals] of Object.entries(K)) {
  const path = join(MSG_DIR, `${loc}.json`)
  const json = JSON.parse(readFileSync(path, "utf8"))
  if (json.analytics && typeof json.analytics === "object") {
    Object.assign(json.analytics, vals)
    writeFileSync(path, JSON.stringify(json, null, 2) + "\n", "utf8")
    console.log(`✓ ${loc}.json`)
  } else {
    console.error(`✗ ${loc}.json — analytics introuvable`)
    process.exitCode = 1
  }
}
