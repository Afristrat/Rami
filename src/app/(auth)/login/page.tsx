"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"

import { loginSchema, type LoginFormData } from "@/lib/schemas/auth.schema"
import { loginAction } from "@/lib/actions/auth.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AuthCard,
  RamiLogo,
  FormAlert,
  FieldError,
} from "@/components/auth/auth-card"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setServerError(null)
    const result = await loginAction(data)
    if (result?.error) {
      setServerError(result.error)
    }
  }

  return (
    <AuthCard>
      <RamiLogo />

      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-white">Bon retour !</h1>
        <p className="text-sm text-white/40 mt-1">
          Connectez-vous à votre espace RAMI
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <FormAlert type="error" message={serverError} />}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/70">
            Email
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/70">
              Mot de passe
            </Label>
            <Link
              href="/reset-password"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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
          <FieldError message={errors.password?.message} />
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
              Se connecter
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-white/30">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
