"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { checkSlugAvailability } from "@/app/actions/onboarding"
import { cn } from "@/lib/utils"

const stepSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(63, "Le slug ne peut pas dépasser 63 caractères")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Lettres minuscules, chiffres et tirets uniquement"
    ),
})

type StepData = z.infer<typeof stepSchema>

interface StepTenantProps {
  defaultValues?: Partial<StepData>
  onNext: (data: StepData) => void
}

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 63)
}

export function StepTenant({ defaultValues, onNext }: StepTenantProps) {
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle")
  const [slugModified, setSlugModified] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<StepData>({
    resolver: zodResolver(stepSchema),
    defaultValues: defaultValues ?? { name: "", slug: "" },
    mode: "onChange",
  })

  const watchedName = watch("name")
  const watchedSlug = watch("slug")

  // Auto-génération du slug depuis le nom
  useEffect(() => {
    if (!slugModified && watchedName) {
      const generated = nameToSlug(watchedName)
      if (generated) {
        setValue("slug", generated, { shouldValidate: true })
      }
    }
  }, [watchedName, slugModified, setValue])

  // Vérification de disponibilité du slug (debounced)
  const checkSlug = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        setSlugStatus("idle")
        return
      }
      setSlugStatus("checking")
      try {
        const { available } = await checkSlugAvailability(slug)
        setSlugStatus(available ? "available" : "taken")
      } catch {
        setSlugStatus("idle")
      }
    },
    []
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchedSlug) checkSlug(watchedSlug)
    }, 600)
    return () => clearTimeout(timer)
  }, [watchedSlug, checkSlug])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Votre espace de travail
          </h2>
          <p className="text-sm text-muted-foreground">
            Donnez un nom à votre agence ou marque
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Nom */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Nom de l&apos;agence / marque
            <span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            id="name"
            placeholder="ex : AI-MPower Consulting"
            className="h-10 text-base"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">
            Identifiant unique (slug)
            <span className="text-destructive ml-1">*</span>
          </Label>
          <div className="relative">
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                rami.ai/
              </span>
              <Input
                id="slug"
                placeholder="mon-agence"
                className={cn(
                  "h-10 rounded-l-none text-base",
                  slugStatus === "available" && "border-green-500 pr-9",
                  slugStatus === "taken" && "border-destructive pr-9"
                )}
                aria-invalid={!!errors.slug || slugStatus === "taken"}
                {...register("slug", {
                  onChange: () => setSlugModified(true),
                })}
              />
              {/* Indicateur disponibilité */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {slugStatus === "checking" && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
                {slugStatus === "available" && (
                  <CheckCircle2 className="size-4 text-green-500" />
                )}
                {slugStatus === "taken" && (
                  <XCircle className="size-4 text-destructive" />
                )}
              </div>
            </div>
          </div>
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          )}
          {slugStatus === "available" && !errors.slug && (
            <p className="text-xs text-green-600">
              ✓ Disponible — parfait !
            </p>
          )}
          {slugStatus === "taken" && (
            <p className="text-xs text-destructive">
              Ce slug est déjà utilisé. Essayez une variante.
            </p>
          )}
          {!errors.slug && slugStatus === "idle" && watchedSlug && (
            <p className="text-xs text-muted-foreground">
              Généré automatiquement depuis le nom — vous pouvez le modifier
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={!isValid || slugStatus === "taken" || slugStatus === "checking"}
          className="min-w-[140px]"
        >
          Continuer →
        </Button>
      </div>
    </form>
  )
}
