"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { loginSchema, type LoginFormData } from "@/lib/schemas/auth.schema"
import { loginAction } from "@/lib/actions/auth.actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AuthCard,
  AuthHeader,
  AuthDivider,
  FormAlert,
  FieldError,
  GoogleIcon,
  GitHubIcon,
} from "@/components/auth/auth-card"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const t = useTranslations("auth.login")
  const tCommon = useTranslations("common")

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
      <AuthHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {serverError && <FormAlert type="error" message={serverError} />}

        {/* Email */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium ml-1 text-gray-700 dark:text-white/80"
          >
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            className="h-12 rounded-xl px-4 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#7c3bed]/50 focus-visible:ring-[#7c3bed]/20 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/30 dark:focus-visible:border-[#7c3bed]/50 dark:focus-visible:ring-[#7c3bed]/20"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 dark:text-white/80"
            >
              {t("password")}
            </Label>
            <Link
              href="/reset-password"
              className="text-xs text-[#7c3bed] hover:underline transition-colors"
            >
              {t("forgot")}
            </Link>
          </div>
          <div className="relative flex items-center">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
              className="h-12 rounded-xl px-4 pr-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:border-[#7c3bed]/50 focus-visible:ring-[#7c3bed]/20 dark:bg-white/[0.06] dark:border-white/[0.08] dark:text-white dark:placeholder:text-white/30 dark:focus-visible:border-[#7c3bed]/50 dark:focus-visible:ring-[#7c3bed]/20"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rami-btn-gradient w-full rounded-xl py-4 text-base font-bold text-white shadow-lg shadow-[#7c3bed]/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : (
            t("submit")
          )}
        </button>
      </form>

      {/* Divider */}
      <AuthDivider text={tCommon("continueWith")} />

      {/* Social logins */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent py-3 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent py-3 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <GitHubIcon />
          GitHub
        </button>
      </div>

      {/* Register link */}
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-white/40">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="font-semibold text-[#7c3bed] hover:text-[#7c3bed]/80 transition-colors ml-1"
        >
          {t("createAccount")}
        </Link>
      </p>
    </AuthCard>
  )
}
