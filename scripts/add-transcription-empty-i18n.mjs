// Injection one-off des clés d'état vide (US-022) dans transcriptions.* des 8 locales.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MSG_DIR = join(__dirname, "..", "messages")

const K = {
  fr: { emptyTitle: "Aucune transcription", emptyDesc: "Importez un fichier audio pour générer votre première transcription." },
  en: { emptyTitle: "No transcriptions", emptyDesc: "Upload an audio file to generate your first transcription." },
  es: { emptyTitle: "Sin transcripciones", emptyDesc: "Sube un archivo de audio para generar tu primera transcripción." },
  de: { emptyTitle: "Keine Transkriptionen", emptyDesc: "Laden Sie eine Audiodatei hoch, um Ihre erste Transkription zu erstellen." },
  pt: { emptyTitle: "Sem transcrições", emptyDesc: "Envie um arquivo de áudio para gerar sua primeira transcrição." },
  tr: { emptyTitle: "Henüz transkripsiyon yok", emptyDesc: "İlk transkripsiyonunuzu oluşturmak için bir ses dosyası yükleyin." },
  ar: { emptyTitle: "لا توجد عمليات تفريغ", emptyDesc: "ارفع ملفًا صوتيًا لإنشاء أول تفريغ نصي لك." },
  zh: { emptyTitle: "暂无转录", emptyDesc: "上传音频文件以生成您的第一份转录。" },
}

for (const [loc, vals] of Object.entries(K)) {
  const path = join(MSG_DIR, `${loc}.json`)
  const json = JSON.parse(readFileSync(path, "utf8"))
  if (json.transcriptions && typeof json.transcriptions === "object") {
    Object.assign(json.transcriptions, vals)
    writeFileSync(path, JSON.stringify(json, null, 2) + "\n", "utf8")
    console.log(`✓ ${loc}.json`)
  } else {
    console.error(`✗ ${loc}.json — transcriptions introuvable`)
    process.exitCode = 1
  }
}
