"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { step1Schema, type Step1Data } from "@/lib/schemas/workflow.schema"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChevronRight, Brain } from "lucide-react"

const OBJECTIFS = [
  { value: "confiance", label: "Confiance", desc: "Sécurité, autorité, fiabilité", color: "text-blue-500", bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" },
  { value: "urgence", label: "Urgence", desc: "Action immédiate, dynamisme", color: "text-red-500", bg: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20" },
  { value: "aspiration", label: "Aspiration", desc: "Luxe, élévation, prestige", color: "text-amber-500", bg: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20" },
  { value: "expertise", label: "Expertise", desc: "Compétence, autorité sectorielle", color: "text-indigo-500", bg: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20" },
  { value: "communauté", label: "Communauté", desc: "Appartenance, engagement, lien", color: "text-orange-500", bg: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20" },
  { value: "joie", label: "Joie", desc: "Positivité, célébration, légèreté", color: "text-yellow-500", bg: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20" },
  { value: "sérénité", label: "Sérénité", desc: "Calme, équilibre, bien-être", color: "text-teal-500", bg: "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20" },
] as const

interface Step1BriefProps {
  defaultValues?: Step1Data | null
  onNext: (data: Step1Data) => void
}

export function Step1Brief({ defaultValues, onNext }: Step1BriefProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: defaultValues ?? {
      titre: "",
      description: "",
      objectif: undefined,
      cible: "",
    },
  })

  const selectedObjectif = useWatch({ control, name: "objectif" })
  const description = useWatch({ control, name: "description", defaultValue: "" })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Titre */}
      <div className="space-y-2">
        <Label htmlFor="titre" className="text-sm font-medium">
          Titre du contenu <span className="text-destructive">*</span>
        </Label>
        <Input
          id="titre"
          {...register("titre")}
          placeholder="Ex. : Lancement de notre nouveau service IA…"
          className={cn(errors.titre && "border-destructive")}
        />
        {errors.titre && (
          <p className="text-xs text-destructive">{errors.titre.message}</p>
        )}
      </div>

      {/* Description / Brief */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description" className="text-sm font-medium">
            Brief du contenu <span className="text-destructive">*</span>
          </Label>
          <span className={cn("text-xs", description.length > 1800 ? "text-destructive" : "text-muted-foreground")}>
            {description.length} / 2000
          </span>
        </div>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Décrivez le message principal, le contexte, les points clés à communiquer, les résultats attendus…"
          rows={5}
          className={cn("resize-none", errors.description && "border-destructive")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Objectif cognitif */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-violet-500" />
          <Label className="text-sm font-medium">
            Objectif cognitif <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">(neuropsychologie Causse)</span>
        </div>
        {errors.objectif && (
          <p className="text-xs text-destructive">{errors.objectif.message}</p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {OBJECTIFS.map((obj) => (
            <button
              key={obj.value}
              type="button"
              onClick={() => setValue("objectif", obj.value as Step1Data["objectif"], { shouldValidate: true })}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-all",
                selectedObjectif === obj.value
                  ? `${obj.bg} border-current ring-2 ring-current/30`
                  : "border-border bg-card hover:bg-accent"
              )}
            >
              <span className={cn("text-xs font-semibold", selectedObjectif === obj.value && obj.color)}>
                {obj.label}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">{obj.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cible (optionnel) */}
      <div className="space-y-2">
        <Label htmlFor="cible" className="text-sm font-medium">
          Audience cible <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Input
          id="cible"
          {...register("cible")}
          placeholder="Ex. : Directeurs marketing PME marocaines, 35-50 ans…"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" className="gap-2">
          Continuer
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </form>
  )
}
