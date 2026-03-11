"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/schemas/auth.schema"
import { resetPasswordAction } from "@/lib/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AuthCard,
  RamiLogo,
  FormAlert,
  FieldError,
} from "@/components/auth/auth-card"

export default function ResetPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onSubmit(data: ResetPasswordFormData) {
    setServerError(null)
    setSuccess(null)
    const result = await resetPasswordAction({ email: data.email })
    if (result.error) {
      setServerError(result.error)
    } else if (result.success) {
      setSuccess(result.success)
    }
  }

  if (success) {
    return (
      <AuthCard>
        <RamiLogo />
        <div className="text-center space-y-5">
          <div className="flex justify-center">
            <div className="rounded-full bg-violet-500/10 p-4 border border-violet-500/20">
              <Mail className="h-10 w-10 text-violet-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Vérifiez votre email</h2>
            <p className="text-sm text-white/40 mt-2 leading-relaxed">{success}</p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-left space-y-1.5">
            {[
              "Ouvrez l'email de réinitialisation",
              "Cliquez sur le lien sécurisé",
              "Définissez votre nouveau mot de passe",
            ].map((step, i) => (
              <div key={step} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] text-violet-400 font-bold">
                  {i + 1}
                </span>
                <span className="text-xs text-white/40">{step}</span>
              </div>
            ))}
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <RamiLogo />

      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-white">
          Réinitialiser le mot de passe
        </h1>
        <p className="text-sm text-white/40 mt-1 leading-relaxed">
          Entrez votre email et nous vous enverrons un lien de réinitialisation.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <FormAlert type="error" message={serverError} />}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/70">
            Adresse email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 mt-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/20 border-0"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Mail className="h-4 w-4 mr-1.5" />
              Envoyer le lien
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la connexion
        </Link>
      </div>
    </AuthCard>
  )
}
