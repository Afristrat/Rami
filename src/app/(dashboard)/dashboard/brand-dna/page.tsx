import { Sparkles } from "lucide-react"
import { getBrandDnaAction } from "@/lib/actions/brand-dna.actions"
import { BrandDnaForm } from "@/components/brand-dna/brand-dna-form"

export const metadata = {
  title: "Brand DNA — RAMI",
  description: "Configurez l'ADN de votre marque pour générer du contenu neuropsychologiquement calibré.",
}

export default async function BrandDnaPage() {
  const result = await getBrandDnaAction()
  const initialData = "data" in result ? result.data : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* En-tête page */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Sparkles className="size-4" />
          <span className="text-sm font-medium">Brand DNA</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {initialData ? "Modifier votre Brand DNA" : "Configurez votre Brand DNA"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          L&apos;ADN de marque guide chaque visuel généré par RAMI — couleurs, ton, formes. Chaque
          post devient une flèche calibrée pour toucher l&apos;émotion précise de votre audience.
        </p>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "🧠 Neuropsychologie des couleurs (Causse)",
            "🎯 Psychologie des formes (Gestalt)",
            "📐 Calibrage par culture et secteur",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Indicateur Brand DNA existant */}
        {initialData && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900/50 dark:bg-green-950/30">
            <span className="size-2 shrink-0 rounded-full bg-green-500" />
            <p className="text-xs font-medium text-green-800 dark:text-green-300">
              Brand DNA actif —{" "}
              <span className="font-bold">{initialData.brandName}</span>
            </p>
          </div>
        )}
      </div>

      {/* Formulaire Brand DNA */}
      <BrandDnaForm initialData={initialData} />
    </div>
  )
}
