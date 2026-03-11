import { Sparkles } from "lucide-react"
import { BrandDnaForm } from "@/components/brand-dna/brand-dna-form"

export const metadata = {
  title: "Brand DNA — RAMI",
  description: "Configurez l'ADN de votre marque pour générer du contenu neuropsychologiquement calibré.",
}

export default function BrandDnaPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* En-tête page */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Sparkles className="size-4" />
          <span className="text-sm font-medium">Brand DNA</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurez votre Brand DNA
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
      </div>

      {/* Formulaire Brand DNA */}
      <BrandDnaForm />
    </div>
  )
}
