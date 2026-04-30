"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("auth.resetPassword")
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
            <div className="rounded-full bg-violet-100 dark:bg-violet-500/10 p-4 border border-violet-200 dark:border-violet-500/20">
              <Mail className="h-10 w-10 text-violet-500 dark:text-violet-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t("checkEmail")}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{success}</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-3 text-left space-y-1.5">
            {[
              t("step1"),
              t("step2"),
              t("step3"),
            ].map((step, i) => (
              <div key={step} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20 text-[10px] text-violet-600 dark:text-violet-400 font-bold">
                  {i + 1}
                </span>
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToLogin")}
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <RamiLogo />

      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <FormAlert type="error" message={serverError} />}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-foreground/70">
            {t("emailLabel")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            className="bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.08] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 mt-2 rami-btn-gradient font-medium shadow-lg shadow-violet-500/20 border-0"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Mail className="h-4 w-4 mr-1.5" />
              {t("submit")}
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("backToLogin")}
        </Link>
      </div>
    </AuthCard>
  )
}
