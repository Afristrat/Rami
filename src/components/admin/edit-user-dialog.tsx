"use client"

import { useState, useTransition, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  X, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Shield, User,
} from "lucide-react"
import { updateUserAction, resetUserPasswordAction } from "@/lib/actions/admin.actions"
import type { AdminUser } from "@/lib/actions/admin.actions"

type Props = {
  user: AdminUser | null
  onClose: () => void
  onUpdated: (userId: string, fields: Partial<AdminUser>) => void
}

type Tab = "profile" | "password"

export function EditUserDialog({ user, onClose, onUpdated }: Props) {
  const t = useTranslations("admin")
  const [tab, setTab] = useState<Tab>("profile")
  const [isPending, startTransition] = useTransition()

  // Profile fields
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [globalRole, setGlobalRole] = useState<"user" | "super_admin">("user")

  // Password fields
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setDisplayName(user.display_name ?? "")
        setEmail(user.email ?? "")
        setGlobalRole((user.role as "user" | "super_admin") ?? "user")
        setPassword("")
        setPasswordConfirm("")
        setError(null)
        setSuccess(null)
        setTab("profile")
      })
    }
  }, [user])

  function handleClose() {
    if (isPending) return
    onClose()
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await updateUserAction(user.id, {
        display_name: displayName,
        email,
        global_role: globalRole,
      })

      if ("error" in result) {
        setError(result.error)
        return
      }

      setSuccess(t("profileUpdated"))
      onUpdated(user.id, { display_name: displayName, email, role: globalRole })
    })
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSuccess(null)

    if (password !== passwordConfirm) {
      setError(t("passwordsDontMatch"))
      return
    }
    if (password.length < 8) {
      setError(t("minChars"))
      return
    }

    startTransition(async () => {
      const result = await resetUserPasswordAction(user.id, password)

      if ("error" in result) {
        setError(result.error)
        return
      }

      setSuccess(t("passwordChanged"))
      setPassword("")
      setPasswordConfirm("")
    })
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} aria-hidden />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("editUser")}</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[280px]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {([
            { id: "profile" as Tab, label: t("profileTab"), icon: User },
            { id: "password" as Tab, label: t("passwordTab"), icon: Shield },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setTab(id); setError(null); setSuccess(null) }}
              className={`flex items-center gap-2 flex-1 justify-center py-3 text-xs font-medium border-b-2 transition-colors ${
                tab === id
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab — Profil */}
        {tab === "profile" && (
          <form onSubmit={handleProfileSubmit}>
            <div className="px-5 py-5 space-y-4">

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t("displayName")}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("displayNamePlaceholder")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("emailChangeNote")}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t("globalRole")}
                </label>
                <div className="flex gap-2">
                  {(["user", "super_admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setGlobalRole(r)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        globalRole === r
                          ? r === "super_admin"
                            ? "border-red-500/30 bg-red-500/10 text-red-400"
                            : "border-violet-500/30 bg-violet-500/10 text-violet-400"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {r === "super_admin" ? "super_admin" : "user"}
                    </button>
                  ))}
                </div>
                {globalRole === "super_admin" && (
                  <p className="mt-1.5 text-[11px] text-amber-400">
                    {t("superAdminWarning")}
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <AlertCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400">{success}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                {t("close")}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {t("save")}
              </button>
            </div>
          </form>
        )}

        {/* Tab — Mot de passe */}
        {tab === "password" && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="px-5 py-5 space-y-4">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <p className="text-xs text-amber-400">
                  {t("passwordChangeWarning")}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t("newPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("minChars")}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-1.5 flex gap-1">
                    {[8, 12, 16].map((len) => (
                      <div
                        key={len}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          password.length >= len ? "bg-emerald-500" : "bg-border"
                        }`}
                      />
                    ))}
                    <span className="text-[11px] text-muted-foreground ml-1">
                      {password.length < 8 ? t("tooShort") : password.length < 12 ? t("correct") : t("strong")}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t("confirmPassword")}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder={t("repeatPassword")}
                  autoComplete="new-password"
                  className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                    passwordConfirm && password !== passwordConfirm
                      ? "border-red-500/50"
                      : "border-border"
                  }`}
                />
                {passwordConfirm && password !== passwordConfirm && (
                  <p className="mt-1 text-[11px] text-red-400">{t("passwordsDontMatch")}</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <AlertCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-400">{success}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                {t("close")}
              </button>
              <button
                type="submit"
                disabled={isPending || password.length < 8 || password !== passwordConfirm}
                className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {t("changePassword")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
