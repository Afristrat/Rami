"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Users,
} from "lucide-react"
import { useTranslations } from "next-intl"
import {
  updateProfileAction,
  updateNotificationPreferencesAction,
  setCollectiveOptinAction,
  deleteTenantAction,
  type UserProfile,
  type NotificationPreferences,
} from "@/lib/actions/settings.actions"
import { exportMyDataAction } from "@/lib/actions/data-export.actions"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Glass Card ──────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className,
  danger,
}: {
  children: React.ReactNode
  className?: string
  danger?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all",
        // Light mode
        "bg-white border border-gray-200/60 shadow-sm",
        // Dark mode
        "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08] dark:shadow-none",
        danger && "dark:border-red-500/20 dark:bg-red-500/5 border-red-200 bg-red-50",
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── Toggle Switch ──────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div
        className={cn(
          "w-11 h-6 rounded-full transition-colors",
          "bg-gray-200 dark:bg-white/10",
          "peer-checked:bg-violet-600 dark:peer-checked:bg-violet-600",
          "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
          "after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all",
          "peer-checked:after:translate-x-full",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
    </label>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile
  initialPrefs: NotificationPreferences
  initialCollectiveOptin: boolean
}

const CONFIRMATION_PHRASE = "SUPPRIMER MON ESPACE"

export function GeneralSettingsClient({ profile, initialPrefs, initialCollectiveOptin }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const t = useTranslations("settings")
  const tProfile = useTranslations("settings.profileSection")
  const tNotif = useTranslations("settings.notificationsSection")
  const tDanger = useTranslations("settings.dangerSection")
  const tWorkspace = useTranslations("settings.workspace")
  const tCommon = useTranslations("common")

  // Profile state
  const [fullName, setFullName] = useState(profile.fullName)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "")
  const [previewUrl, setPreviewUrl] = useState(profile.avatarUrl ?? "")
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [isProfilePending, startProfileTransition] = useTransition()

  // Notifications state
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs)
  const [notifSaved, setNotifSaved] = useState(false)
  const [isNotifPending, startNotifTransition] = useTransition()

  // Intelligence collective — opt-in (US-011)
  const [collectiveOptin, setCollectiveOptin] = useState(initialCollectiveOptin)
  const [optinMessage, setOptinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isOptinPending, startOptinTransition] = useTransition()

  // Danger zone state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeletePending, startDeleteTransition] = useTransition()
  const isDeleteConfirmed = deleteInput === CONFIRMATION_PHRASE

  // Export RGPD (portabilité des données)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  async function handleExportData() {
    setExportError(null)
    setIsExporting(true)
    try {
      const result = await exportMyDataAction()
      if (!result.success || !result.data) {
        setExportError(tDanger("exportError"))
        return
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const stamp = new Date().toISOString().slice(0, 10)
      const a = document.createElement("a")
      a.href = url
      a.download = `rami-export-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setExportError(tDanger("exportError"))
    } finally {
      setIsExporting(false)
    }
  }

  // ─── Profile handlers ──────────────────────────────────────────────────────

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileMessage({ type: "error", text: tProfile("invalidFormat") })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: "error", text: tProfile("fileTooLarge") })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setPreviewUrl(result)
      setAvatarUrl(result)
    }
    reader.readAsDataURL(file)
  }

  function handleProfileSave() {
    setProfileMessage(null)
    startProfileTransition(async () => {
      const result = await updateProfileAction({
        fullName,
        avatarUrl: avatarUrl || undefined,
      })
      if (result.error) {
        setProfileMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setProfileMessage({ type: "success", text: result.success })
      }
    })
  }

  // ─── Notification handlers ─────────────────────────────────────────────────

  function toggleNotif(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
    setNotifSaved(false)
  }

  function handleNotifSave() {
    startNotifTransition(async () => {
      const result = await updateNotificationPreferencesAction(prefs)
      if (!result.error) setNotifSaved(true)
    })
  }

  // ─── Opt-in collectif handler ───────────────────────────────────────────────

  function handleCollectiveOptinToggle() {
    const next = !collectiveOptin
    setCollectiveOptin(next) // optimiste
    setOptinMessage(null)
    startOptinTransition(async () => {
      const result = await setCollectiveOptinAction(next)
      if (result.error) {
        setCollectiveOptin(!next) // rollback visuel
        setOptinMessage({ type: "error", text: result.error })
      } else {
        setOptinMessage({
          type: "success",
          text: next
            ? "Vous contribuez désormais aux benchmarks collectifs anonymisés."
            : "Vous ne contribuez plus aux benchmarks et n'y avez plus accès.",
        })
      }
    })
  }

  // ─── Delete handler ────────────────────────────────────────────────────────

  function handleDelete() {
    setDeleteError(null)
    startDeleteTransition(async () => {
      const result = await deleteTenantAction(deleteInput)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      router.push("/login")
    })
  }

  // ─── Notification items ────────────────────────────────────────────────────

  const NOTIF_ITEMS: Array<{
    key: keyof NotificationPreferences
    labelKey: string
    descriptionKey: string
  }> = [
    {
      key: "emailPostPublished",
      labelKey: "postPublished",
      descriptionKey: "postPublishedDescAlt",
    },
    {
      key: "emailPostFailed",
      labelKey: "postFailed",
      descriptionKey: "postFailedDescAlt",
    },
    {
      key: "emailQuotaWarning",
      labelKey: "tokenExpiring",
      descriptionKey: "tokenExpiringDesc",
    },
    {
      key: "emailWeeklyDigest",
      labelKey: "weeklyReport",
      descriptionKey: "weeklyReportDescAlt",
    },
    {
      key: "emailBrandDnaTips",
      labelKey: "newFeatures",
      descriptionKey: "newFeaturesDesc",
    },
  ]

  return (
    <div className="space-y-6">
      {/* ─── Section 1: Profil ───────────────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="size-20 rounded-full border-2 border-violet-500/30 p-1">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Avatar"
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-full bg-violet-500/10">
                    {fullName ? (
                      <span className="text-xl font-semibold text-violet-500">
                        {getInitials(fullName)}
                      </span>
                    ) : (
                      <User className="size-8 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-white uppercase">{tProfile("editOverlay")}</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-white">{tProfile("title")}</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400">
                {tProfile("subtitlePreferences")}
              </p>
            </div>
          </div>
          <button
            onClick={handleProfileSave}
            disabled={isProfilePending}
            className={cn(
              "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90",
              "text-white px-5 py-2 rounded-xl text-sm font-bold transition-all",
              "shadow-lg shadow-violet-500/20",
              "disabled:opacity-50 flex items-center gap-2"
            )}
          >
            {isProfilePending && <Loader2 className="size-4 animate-spin" />}
            {t("saveButton")}
          </button>
        </div>

        {/* Profile message */}
        {profileMessage && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 text-sm mb-6",
              profileMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {profileMessage.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            {profileMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
              {tProfile("fullName")}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm transition-all",
                "bg-gray-50 border border-gray-200 text-foreground focus:ring-violet-500 focus:border-violet-500",
                "dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:ring-violet-500 dark:focus:border-violet-500"
              )}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
              {tProfile("email")}
            </label>
            <div className="relative">
              <input
                type="email"
                value={profile.email}
                disabled
                className={cn(
                  "w-full rounded-xl px-4 py-3 text-sm",
                  "bg-gray-100 border border-gray-200 text-muted-foreground",
                  "dark:bg-white/5 dark:border-white/10 dark:text-white"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                <CheckCircle2 className="size-3" />
                {tProfile("verified")}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
              {tProfile("timezone")}
            </label>
            <select
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm appearance-none",
                "bg-gray-50 border border-gray-200 text-foreground",
                "dark:bg-white/5 dark:border-white/10 dark:text-white"
              )}
            >
              <option>Europe/Paris (GMT+01:00)</option>
              <option>Africa/Casablanca (GMT+01:00)</option>
              <option>America/New_York (GMT-05:00)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
              {tProfile("language")}
            </label>
            <select
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm appearance-none",
                "bg-gray-50 border border-gray-200 text-foreground",
                "dark:bg-white/5 dark:border-white/10 dark:text-white"
              )}
            >
              <option>Fran\u00e7ais</option>
              <option>English</option>
              <option>Espa\u00f1ol</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* ─── Section 2: Espace de travail ────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-foreground dark:text-white">
                {tWorkspace("title")}
              </h3>
              <span className="bg-violet-600 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-widest">
                PRO — $149/MOIS
              </span>
            </div>
            <p className="text-sm text-muted-foreground dark:text-slate-400">
              {tWorkspace("subtitle")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
              {tWorkspace("nameLabel")}
            </label>
            <input
              type="text"
              defaultValue={tWorkspace("nameDefault")}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm",
                "bg-gray-50 border border-gray-200 text-foreground focus:ring-violet-500 focus:border-violet-500",
                "dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:ring-violet-500 dark:focus:border-violet-500"
              )}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider">
              {tWorkspace("slugLabel")}
            </label>
            <div className="flex">
              <input
                type="text"
                defaultValue={tWorkspace("slugDefault")}
                className={cn(
                  "flex-1 rounded-l-xl px-4 py-3 text-sm",
                  "bg-gray-50 border border-gray-200 text-foreground focus:ring-violet-500 focus:border-violet-500",
                  "dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:ring-violet-500 dark:focus:border-violet-500"
                )}
              />
              <span
                className={cn(
                  "border-y border-r rounded-r-xl px-4 py-3 text-sm flex items-center",
                  "bg-gray-100 border-gray-200 text-muted-foreground",
                  "dark:bg-white/10 dark:border-white/10 dark:text-slate-400"
                )}
              >
                .rami.ai-mpower.com
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-gray-200 dark:border-white/5">
          <QuotaBar label={tWorkspace("generationsAi")} current={320} max={500} color="violet" />
          <QuotaBar label={tWorkspace("storage")} current={12.4} max={50} suffix="GB" color="blue" />
          <QuotaBar label={tWorkspace("tenantsSites")} current={7} max={10} color="indigo" />
        </div>
      </GlassCard>

      {/* ─── Section 3: Notifications ────────────────────────────────────── */}
      <GlassCard>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-foreground dark:text-white">{tNotif("title")}</h3>
          {notifSaved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              {tNotif("savedLabel")}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6">
          {tNotif("controlSubtitle")}
        </p>

        <div className="space-y-1 mb-8">
          {NOTIF_ITEMS.map((item) => (
            <div
              key={item.key}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl transition-all",
                "hover:bg-gray-50 dark:hover:bg-white/5"
              )}
            >
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    !prefs[item.key] && "text-muted-foreground dark:text-slate-500"
                  )}
                >
                  {tNotif(item.labelKey)}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    prefs[item.key]
                      ? "text-muted-foreground dark:text-slate-500"
                      : "text-muted-foreground/60 dark:text-slate-600"
                  )}
                >
                  {tNotif(item.descriptionKey)}
                </p>
              </div>
              <ToggleSwitch
                checked={prefs[item.key]}
                onChange={() => toggleNotif(item.key)}
                disabled={isNotifPending}
              />
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-white/5">
          <p className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider mb-4">
            {tNotif("channelTitle")}
          </p>
          <div className="flex gap-8">
            {([
              { labelKey: "channelEmail" as const, idx: 0 },
              { labelKey: "channelPush" as const, idx: 1 },
              { labelKey: "channelBoth" as const, idx: 2 },
            ]).map(({ labelKey, idx }) => (
              <label key={labelKey} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="channel"
                  defaultChecked={idx === 2}
                  className="sr-only peer"
                />
                <div
                  className={cn(
                    "size-4 rounded-full border transition-all flex items-center justify-center",
                    "border-gray-300 dark:border-white/20",
                    "peer-checked:border-violet-600 peer-checked:bg-violet-600 dark:peer-checked:border-violet-500 dark:peer-checked:bg-violet-500"
                  )}
                >
                  <div className="size-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100" />
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    "text-muted-foreground group-hover:text-foreground",
                    "dark:text-slate-400 dark:group-hover:text-white",
                    idx === 2 && "font-semibold text-foreground dark:text-white"
                  )}
                >
                  {tNotif(labelKey)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleNotifSave}
            disabled={isNotifPending}
            className={cn(
              "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90",
              "text-white px-5 py-2 rounded-xl text-sm font-bold transition-all",
              "shadow-lg shadow-violet-500/20",
              "disabled:opacity-50 flex items-center gap-2"
            )}
          >
            {isNotifPending && <Loader2 className="size-4 animate-spin" />}
            {t("saveButton")}
          </button>
        </div>
      </GlassCard>

      {/* ─── Section : Intelligence collective (opt-in RGPD) ─────────────── */}
      <GlassCard>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
              <Users className="size-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-white">
                Intelligence collective
              </h3>
              <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400 max-w-2xl">
                Contribuez vos statistiques de performance, <strong>entièrement anonymisées
                et agrégées</strong> (jamais de données individuelles), pour débloquer en
                échange l&apos;accès aux <strong>benchmarks collectifs de votre secteur</strong> :
                couleurs, formats et créneaux qui performent le mieux. Les agrégats ne sont
                calculés qu&apos;à partir d&apos;au moins 5 marques distinctes (k-anonymity).
              </p>
              <p className="mt-2 text-xs text-muted-foreground/80 dark:text-slate-500 max-w-2xl">
                Finalité : amélioration des recommandations de génération. Aucune donnée
                brute n&apos;est exposée à un tiers. Vous pouvez retirer votre consentement à
                tout moment — le refus désactive également votre accès aux benchmarks.
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={collectiveOptin}
            onChange={handleCollectiveOptinToggle}
            disabled={isOptinPending}
          />
        </div>
        {optinMessage && (
          <div
            className={cn(
              "mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm",
              optinMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {optinMessage.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            {optinMessage.text}
          </div>
        )}
      </GlassCard>

      {/* ─── Section 4: Zone de danger ───────────────────────────────────── */}
      <GlassCard danger>
        <h3 className="text-lg font-bold text-red-500 dark:text-red-400 mb-1">{tDanger("title")}</h3>
        <p className="text-sm text-red-500/60 dark:text-red-500/60 mb-8">
          {tDanger("subtitleFull")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className={cn(
              "flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all",
              "border border-gray-200 bg-gray-50 hover:bg-gray-100 text-foreground",
              "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white",
              isExporting && "opacity-60 cursor-not-allowed"
            )}
          >
            {isExporting ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
            {tDanger("exportAllData")}
          </button>
          <button
            onClick={() => {
              setDeleteInput("")
              setDeleteError(null)
              setDeleteOpen(true)
            }}
            className={cn(
              "flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all",
              "border border-red-300 hover:bg-red-50 text-red-500",
              "dark:border-red-500/40 dark:hover:bg-red-500/10 dark:text-red-500"
            )}
          >
            <Trash2 className="size-5" />
            {tDanger("deleteMyAccount")}
          </button>
        </div>
        {exportError && (
          <p className="mt-3 text-xs text-red-500">{exportError}</p>
        )}
      </GlassCard>

      {/* ─── Delete confirmation dialog ──────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={(v) => !isDeletePending && setDeleteOpen(v)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 mb-2">
              <AlertCircle className="size-5 text-destructive" />
            </div>
            <DialogTitle>{tDanger("deleteWorkspace")}</DialogTitle>
            <DialogDescription className="text-left">
              {tDanger("deleteDefinitive")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <Label htmlFor="confirmInput" className="text-sm">
              {tDanger("deleteConfirm", { phrase: CONFIRMATION_PHRASE })}
            </Label>
            <Input
              id="confirmInput"
              value={deleteInput}
              onChange={(e) => {
                setDeleteInput(e.target.value)
                setDeleteError(null)
              }}
              placeholder={CONFIRMATION_PHRASE}
              disabled={isDeletePending}
            />
            {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeletePending}>
                {tCommon("cancel")}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isDeleteConfirmed || isDeletePending}
            >
              {isDeletePending && <Loader2 className="size-4 animate-spin" />}
              {isDeletePending ? tDanger("deleting") : tDanger("deleteForever")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Quota bar sub-component ──────────────────────────────────────────────────

function QuotaBar({
  label,
  current,
  max,
  suffix,
  color = "violet",
}: {
  label: string
  current: number
  max: number
  suffix?: string
  color?: "violet" | "blue" | "indigo"
}) {
  const percent = Math.round((current / max) * 100)
  const colorClasses = {
    violet: "bg-violet-600 dark:bg-violet-500",
    blue: "bg-blue-500",
    indigo: "bg-indigo-400",
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs">
        <span className="font-bold text-foreground/80 dark:text-slate-300">{label}</span>
        <span className="text-muted-foreground dark:text-slate-400">
          {current}{suffix ? suffix : ""} / {max}{suffix ? suffix : ""}
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-white/5">
        <div
          className={cn("h-full rounded-full transition-all", colorClasses[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
