"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react"

import {
  updatePasswordSchema,
  type UpdatePasswordFormData,
} from "@/lib/schemas/auth.schema"
import { updatePasswordAction } from "@/lib/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AuthCard,
  RamiLogo,
  FormAlert,
  FieldError,
} from "@/components/auth/auth-card"

function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = [
    { label: "8 caractères minimum", ok: password.length >= 8 },
    { label: "Une majuscule", ok: /[A-Z]/.test(password) },
    { label: "Un chiffre", ok: /[0-9]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-1.5">
          <CheckCircle2
            className={`h-3 w-3 flex-shrink-0 transition-colors ${
              check.ok ? "text-emerald-400" : "text-white/20"
            }`}
          />
          <span
            className={`text-[11px] transition-colors ${
              check.ok ? "text-emerald-400" : "text-white/30"
            }`}
          >
            {check.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function UpdatePasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  })

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" })

  async function onSubmit(data: UpdatePasswordFormData) {
    setServerError(null)
    const result = await updatePasswordAction({ password: data.password })
    if (result?.error) {
      setServerError(result.error)
    }
  }

  return (
    <AuthCard>
      <RamiLogo />

      <div className="mb-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="rounded-full bg-violet-500/10 p-3 border border-violet-500/20">
            <ShieldCheck className="h-6 w-6 text-violet-400" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-white">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Choisissez un mot de passe sécurisé pour votre compte RAMI.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <FormAlert type="error" message={serverError} />}

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white/70">
            Nouveau mot de passe
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 pr-10"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrengthIndicator password={passwordValue} />
          <FieldError message={errors.password?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-white/70">
            Confirmer le mot de passe
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 pr-10"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? "Masquer" : "Afficher"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <FieldError message={errors.confirmPassword?.message} />
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
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              Mettre à jour le mot de passe
            </>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
