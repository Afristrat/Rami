"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth.schema"
import { registerAction } from "@/lib/actions/auth.actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AuthCard,
  AuthHeader,
  RamiLogo,
  FormAlert,
  FieldError,
} from "@/components/auth/auth-card"
import { cn } from "@/lib/utils"

/* ─── Password strength indicator ─── */

function PasswordStrengthBar({ password }: { password: string }) {
  const length = password.length
  let widthClass = "w-0"
  let colorClass = ""

  if (length >= 10) {
    widthClass = "w-full"
    colorClass = "bg-emerald-500"
  } else if (length >= 5) {
    widthClass = "w-2/3"
    colorClass = "bg-amber-500"
  } else if (length > 0) {
    widthClass = "w-1/3"
    colorClass = "bg-red-500"
  }

  if (!password) return null

  return (
    <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mt-3">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300 ease-in-out",
          widthClass,
          colorClass
        )}
      />
    </div>
  )
}

function PasswordChecklist({ password }: { password: string }) {
  const t = useTranslations("auth.register")
  const checks = [
    { label: t("passwordMinLength"), ok: password.length >= 8 },
    { label: t("passwordSpecialChar"), ok: /[^A-Za-z0-9]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="space-y-2 pt-1">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-2">
          <CheckCircle2
            className={cn(
              "h-3.5 w-3.5 flex-shrink-0 transition-colors",
              check.ok
                ? "text-emerald-500 dark:text-emerald-400"
                : "text-gray-300 dark:text-gray-500"
            )}
          />
          <span
            className={cn(
              "text-xs transition-colors",
              check.ok
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-400 dark:text-gray-500"
            )}
          >
            {check.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Register Page ─── */

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const t = useTranslations("auth.register")
  const tLogin = useTranslations("auth.login")

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" })

  async function onSubmit(data: RegisterFormData) {
    setServerError(null)
    setSuccess(null)
    const result = await registerAction({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    })
    if (result.error) {
      setServerError(result.error)
    } else if (result.success) {
      setSuccess(result.success)
    }
  }

  /* ── Success state ── */
  if (success) {
    return (
      <AuthCard>
        <RamiLogo />
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-4 border border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("emailSent")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-2">{success}</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[#7c3bed] hover:text-[#7c3bed]/80 transition-colors"
          >
            {t("backToLogin")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </AuthCard>
    )
  }

  /* ── Registration form ── */
  return (
    <AuthCard>
      <AuthHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && <FormAlert type="error" message={serverError} />}

        {/* Full name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="fullName"
            className="text-sm font-medium ml-1 text-gray-700 dark:text-gray-300"
          >
            {t("fullName")}
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder={t("fullNamePlaceholder")}
            autoComplete="name"
            className="h-12 rounded-xl px-4 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#7c3bed]/50 focus-visible:ring-[#7c3bed]/20 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:border-[#7c3bed]/50 dark:focus-visible:ring-[#7c3bed]/20"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
          />
          <FieldError message={errors.fullName?.message} />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            className="text-sm font-medium ml-1 text-gray-700 dark:text-gray-300"
          >
            {t("professionalEmail")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            className="h-12 rounded-xl px-4 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#7c3bed]/50 focus-visible:ring-[#7c3bed]/20 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:border-[#7c3bed]/50 dark:focus-visible:ring-[#7c3bed]/20"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium ml-1 text-gray-700 dark:text-gray-300"
          >
            {t("password")}
          </Label>
          <div className="relative flex items-center">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              autoComplete="new-password"
              className="h-12 rounded-xl px-4 pr-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#7c3bed]/50 focus-visible:ring-[#7c3bed]/20 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:border-[#7c3bed]/50 dark:focus-visible:ring-[#7c3bed]/20"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? tLogin("hidePassword") : tLogin("showPassword")}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <PasswordStrengthBar password={passwordValue} />
          <FieldError message={errors.password?.message} />
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium ml-1 text-gray-700 dark:text-gray-300"
          >
            {t("confirmPassword")}
          </Label>
          <div className="relative flex items-center">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              autoComplete="new-password"
              className="h-12 rounded-xl px-4 pr-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#7c3bed]/50 focus-visible:ring-[#7c3bed]/20 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:border-[#7c3bed]/50 dark:focus-visible:ring-[#7c3bed]/20"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? tLogin("hidePassword") : tLogin("showPassword")}
            >
              {showConfirm ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        {/* Password checklist */}
        <PasswordChecklist password={passwordValue} />

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rami-btn-gradient w-full rounded-xl py-3.5 text-base font-semibold text-white shadow-xl shadow-[#7c3bed]/20 mt-4 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : (
            t("submit")
          )}
        </button>
      </form>

      {/* Terms */}
      <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-6 leading-relaxed">
        {t("terms")}{" "}
        <Link
          href="/legal/cgu"
          className="text-[#7c3bed] hover:underline"
        >
          {t("termsOfService")}
        </Link>{" "}
        {t("and")}{" "}
        <Link
          href="/legal/confidentialite"
          className="text-[#7c3bed] hover:underline"
        >
          {t("privacyPolicy")}
        </Link>
        .
      </p>

      {/* Login redirect */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("alreadyHaveAccount")}{" "}
          <Link
            href="/login"
            className="text-[#7c3bed] font-semibold hover:underline ml-1"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
