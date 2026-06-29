"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  RefreshCw,
  AlertTriangle,
  Lock,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { OAuthConnection, ConnectionStatus } from "@/lib/actions/connections.actions"
import { testConnectionAction } from "@/lib/actions/connections.actions"
import type { ConnectionTestResult } from "@/lib/services/publishing/connection-tester"
import {
  TwitterXIcon,
  LinkedInIcon,
  InstagramIcon,
  FacebookIcon,
  PinterestIcon,
} from "./platform-icons"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Platform {
  id: string
  labelKey: string
  descriptionKey: string
  Icon: React.FC<{ className?: string }>
  iconBg: string
  phase: "MVP" | "Phase 2"
  // Plateforme pas encore activée (credentials non provisionnés et/ou publishing
  // pas branché) → affichée « Bientôt », non connectable (zéro bouton cassé).
  // NB : le flow OAuth backend peut déjà exister (cf. OAUTH_CONFIGS) ; ce flag
  // gouverne uniquement l'exposition UI tant que la plateforme n'est pas prête.
  comingSoon?: boolean
}

// ─── Plateformes ──────────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
  {
    id: "linkedin",
    labelKey: "platformLinkedinLabel",
    descriptionKey: "platformLinkedinDesc",
    Icon: LinkedInIcon,
    iconBg: "bg-[#0077B5]/10",
    phase: "MVP",
  },
  {
    id: "instagram",
    labelKey: "platformInstagramLabel",
    descriptionKey: "platformInstagramDesc",
    Icon: InstagramIcon,
    iconBg: "bg-gradient-to-tr from-yellow-400/20 via-pink-500/20 to-purple-600/20",
    phase: "MVP",
  },
  {
    id: "facebook",
    labelKey: "platformFacebookLabel",
    descriptionKey: "platformFacebookDesc",
    Icon: FacebookIcon,
    iconBg: "bg-[#1877F2]/10",
    phase: "MVP",
  },
  {
    id: "twitter",
    labelKey: "platformTwitterLabel",
    descriptionKey: "platformTwitterDesc",
    Icon: TwitterXIcon,
    iconBg: "bg-gray-200/50 dark:bg-slate-800",
    phase: "MVP",
  },
  {
    id: "youtube",
    labelKey: "platformYoutubeLabel",
    descriptionKey: "platformYoutubeDesc",
    Icon: YoutubeIcon,
    iconBg: "bg-red-500/10",
    phase: "Phase 2",
    comingSoon: true,
  },
  {
    id: "pinterest",
    labelKey: "platformPinterestLabel",
    descriptionKey: "platformPinterestDesc",
    Icon: PinterestIcon,
    iconBg: "bg-[#E60023]/10",
    phase: "MVP",
  },
]

// ─── YouTube Icon (not in platform-icons) ─────────────────────────────────────

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const t = useTranslations("settings.connectionsSection")
  if (status === "connected") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20 text-xs font-bold">
        <span className="size-1.5 rounded-full bg-green-500" />
        {t("connected").toUpperCase()}
      </div>
    )
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 text-xs font-bold">
        <AlertTriangle className="size-3" />
        {t("tokenExpiringSoon").toUpperCase()}
      </div>
    )
  }
  return (
    <div className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">
      {t("disconnected")}
    </div>
  )
}

// ─── Platform Card ────────────────────────────────────────────────────────────

function PlatformCard({
  platform,
  connection,
}: {
  platform: Platform
  connection?: OAuthConnection
}) {
  const t = useTranslations("settings.connectionsSection")
  const tc = useTranslations("common")
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [optimisticDisconnected, setOptimisticDisconnected] = React.useState(false)
  const [testLoading, setTestLoading] = React.useState(false)
  const [testResult, setTestResult] = React.useState<ConnectionTestResult | null>(null)

  const rawStatus: ConnectionStatus = connection?.status ?? "disconnected"
  const status: ConnectionStatus = optimisticDisconnected ? "disconnected" : rawStatus
  const isConnected = status === "connected"
  const isError = status === "error"
  const isDisconnected = status === "disconnected"

  const oauthPath = `/api/oauth/${platform.id}/authorize`

  function handleConnect() {
    window.location.href = oauthPath
  }

  async function handleTestConnection() {
    if (!connection) return
    setTestLoading(true)
    setTestResult(null)
    try {
      const result = await testConnectionAction(connection.id)
      if (result.success) {
        setTestResult(result.data)
      } else {
        setTestResult({ platform: platform.id, status: "error", message: result.error })
      }
    } catch {
      setTestResult({ platform: platform.id, status: "error", message: t("networkError") })
    } finally {
      setTestLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!connection) return
    setLoading(true)
    setOptimisticDisconnected(true)
    try {
      await fetch(`/api/oauth/${platform.id}/disconnect`, { method: "POST" })
      router.refresh()
    } catch {
      setOptimisticDisconnected(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl p-6 transition-all",
        // Light
        "bg-white border border-gray-200/60 shadow-sm",
        // Dark
        "dark:bg-white/[0.04] dark:border-white/5",
        // Error border
        isError && "dark:border-amber-500/40 border-amber-300",
        // Disconnected dimming
        isDisconnected && ""
      )}
    >
      {/* Header: icon + status */}
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-xl", platform.iconBg, isDisconnected && "grayscale opacity-40")}>
          <platform.Icon
            className={cn(
              "size-8",
              platform.id === "linkedin" && "text-[#0077B5]",
              platform.id === "instagram" && "text-[#E1306C]",
              platform.id === "facebook" && "text-[#1877F2]",
              platform.id === "twitter" && "text-foreground dark:text-white",
              platform.id === "youtube" && "text-[#FF0000]",
              platform.id === "pinterest" && "text-[#E60023]",
              isDisconnected && "text-gray-400 dark:text-white"
            )}
          />
        </div>
        {platform.comingSoon ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 text-xs font-bold uppercase tracking-wide">
            {tc("comingSoon")}
          </div>
        ) : (
          <StatusBadge status={status} />
        )}
      </div>

      {/* Connected: show account info */}
      {isConnected && connection ? (
        <>
          <div className="flex items-center gap-3 mb-6">
            {connection.accountAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={connection.accountAvatar}
                alt={connection.accountName}
                className="size-10 rounded-full border-2 border-gray-200 dark:border-white/10"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-500">
                {connection.accountName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <h3 className="font-bold text-foreground dark:text-white">{connection.accountName}</h3>
              <p className="text-xs text-muted-foreground dark:text-slate-500">
                @{connection.accountName?.toLowerCase().replace(/\s/g, "_") ?? "unknown"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              POST
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              ANALYTICS
            </span>
          </div>
        </>
      ) : isError && connection ? (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-500">
              {connection.accountName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h3 className="font-bold text-foreground dark:text-white">{connection.accountName}</h3>
              <p className="text-xs text-muted-foreground dark:text-slate-500">
                @{connection.accountName?.toLowerCase().replace(/\s/g, "_") ?? "unknown"}
              </p>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
            <p className="text-xs text-amber-700 dark:text-amber-200 font-medium flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              {t("tokenExpiringSoon")} —{" "}
              <button
                type="button"
                onClick={handleConnect}
                className="underline font-bold hover:text-amber-600 dark:hover:text-amber-100"
              >
                {t("refreshNow")}
              </button>
            </p>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-bold text-gray-400 dark:text-white/40 mb-1">{t(platform.labelKey)}</h3>
          <p className="text-sm text-gray-400 dark:text-slate-600 mb-8">{t(platform.descriptionKey)}</p>
        </>
      )}

      {/* Actions */}
      <div className="mt-auto">
        {platform.comingSoon && (
          <div
            className={cn(
              "w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-center",
              "border-2 border-dashed border-amber-300/60 text-amber-600/80",
              "dark:border-amber-500/30 dark:text-amber-400/80 cursor-not-allowed select-none"
            )}
          >
            {tc("comingSoon")}
          </div>
        )}
        {isDisconnected && !platform.comingSoon && (
          <button
            onClick={handleConnect}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all",
              "border-2 border-violet-300 text-violet-600 hover:bg-violet-50",
              "dark:border-violet-500/40 dark:text-violet-400 dark:hover:bg-violet-500/10"
            )}
          >
            {t("connectAccount")}
          </button>
        )}

        {(isConnected || isError) && (
          <div className="space-y-3">
            <div className="flex gap-4">
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
              >
                {loading ? (
                  <RefreshCw className="size-3 animate-spin inline mr-1" />
                ) : null}
                {t("disconnect")}
              </button>
              <button
                type="button"
                onClick={handleConnect}
                className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-colors uppercase tracking-widest"
              >
                {t("refreshToken")}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testLoading}
                className="text-xs font-bold text-violet-500 hover:text-violet-400 transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                {testLoading ? (
                  <RefreshCw className="size-3 animate-spin" />
                ) : (
                  <Zap className="size-3" />
                )}
                {t("test")}
              </button>
            </div>
            {testResult && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                  testResult.status === "ok"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : testResult.status === "error"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                )}
              >
                {testResult.status === "ok" ? (
                  <CheckCircle2 className="size-3.5 shrink-0" />
                ) : (
                  <XCircle className="size-3.5 shrink-0" />
                )}
                <span>{testResult.message}</span>
                {testResult.latency_ms !== undefined && (
                  <span className="ml-auto text-[10px] opacity-70">
                    {testResult.latency_ms}ms
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ConnectionsClient ────────────────────────────────────────────────────────

interface Props {
  initialConnections: OAuthConnection[]
}

export function ConnectionsClient({ initialConnections }: Props) {
  const t = useTranslations("settings.connectionsSection")
  const connectionMap = React.useMemo(() => {
    const map = new Map<string, OAuthConnection>()
    for (const conn of initialConnections) {
      map.set(conn.platformId, conn)
    }
    return map
  }, [initialConnections])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-3xl font-black text-foreground dark:text-white tracking-tight mb-2">
          {t("title")}
        </h2>
        <p className="text-muted-foreground dark:text-slate-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Platform grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            connection={connectionMap.get(platform.id)}
          />
        ))}
      </div>

      {/* Security info card */}
      <div
        className={cn(
          "rounded-2xl p-6",
          "bg-gray-50 border border-gray-200/60",
          "dark:bg-white/[0.02] dark:border-white/5"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="size-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
              <Lock className="size-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                {t("securityTitle")}
                <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-500 px-2 py-0.5 rounded border border-green-500/20">
                  CNDP &amp; RGPD
                </span>
              </h4>
              <p className="text-sm text-muted-foreground dark:text-slate-500 mt-1">
                {t("securityNote")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground dark:text-slate-500">
            <div className="flex flex-col items-center">
              <ShieldCheck className="size-6" />
              <span className="text-[8px] mt-1 font-bold uppercase">{t("securityProtect")}</span>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
            <div className="flex flex-col items-center">
              <Lock className="size-6" />
              <span className="text-[8px] mt-1 font-bold uppercase">{t("securityTrust")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
