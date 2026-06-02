// Injection one-off des clés quota (US-020) dans workflow.visuals des 8 locales.
// Idempotent. JSON revalidé à l'écriture.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MSG_DIR = join(__dirname, "..", "messages")

const KEYS = {
  fr: {
    quotaTitle: "Quota de générations atteint",
    quotaDescription: "Vous avez utilisé {count}/{limit} générations ce mois. Passez au plan supérieur pour continuer.",
    quotaUpgrade: "Passer au plan supérieur",
  },
  en: {
    quotaTitle: "Generation quota reached",
    quotaDescription: "You have used {count}/{limit} generations this month. Upgrade your plan to continue.",
    quotaUpgrade: "Upgrade plan",
  },
  es: {
    quotaTitle: "Cuota de generaciones alcanzada",
    quotaDescription: "Has usado {count}/{limit} generaciones este mes. Actualiza tu plan para continuar.",
    quotaUpgrade: "Mejorar plan",
  },
  de: {
    quotaTitle: "Generierungskontingent erreicht",
    quotaDescription: "Sie haben diesen Monat {count}/{limit} Generierungen verwendet. Upgraden Sie Ihren Tarif, um fortzufahren.",
    quotaUpgrade: "Tarif upgraden",
  },
  pt: {
    quotaTitle: "Cota de gerações atingida",
    quotaDescription: "Você usou {count}/{limit} gerações este mês. Atualize seu plano para continuar.",
    quotaUpgrade: "Atualizar plano",
  },
  tr: {
    quotaTitle: "Üretim kotası doldu",
    quotaDescription: "Bu ay {count}/{limit} üretim kullandınız. Devam etmek için planınızı yükseltin.",
    quotaUpgrade: "Planı yükselt",
  },
  ar: {
    quotaTitle: "تم بلوغ حد التوليد",
    quotaDescription: "لقد استخدمت {count}/{limit} عملية توليد هذا الشهر. قم بترقية خطتك للمتابعة.",
    quotaUpgrade: "ترقية الخطة",
  },
  zh: {
    quotaTitle: "已达生成配额上限",
    quotaDescription: "本月您已使用 {count}/{limit} 次生成。升级套餐以继续。",
    quotaUpgrade: "升级套餐",
  },
}

for (const [loc, vals] of Object.entries(KEYS)) {
  const path = join(MSG_DIR, `${loc}.json`)
  const json = JSON.parse(readFileSync(path, "utf8"))
  if (json.workflow && json.workflow.visuals && typeof json.workflow.visuals === "object") {
    Object.assign(json.workflow.visuals, vals)
    writeFileSync(path, JSON.stringify(json, null, 2) + "\n", "utf8")
    console.log(`✓ ${loc}.json`)
  } else {
    console.error(`✗ ${loc}.json — workflow.visuals introuvable`)
    process.exitCode = 1
  }
}
