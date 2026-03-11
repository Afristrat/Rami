"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Unplug, Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { OAuthConnection } from "@/lib/actions/connections.actions"
import {
  TwitterXIcon,
  LinkedInIcon,
  InstagramIcon,
  FacebookIcon,
  PinterestIcon,
} from "./platform-icons"

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionStatus = "connected" | "disconnected" | "error"

interface Platform {
  id: string
  label: string
  description: string
  Icon: React.FC<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  phase: "MVP" | "Phase 2"
}

// ─── Plateformes disponibles ──────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
  {
    id: "twitter",
    label: "X (Twitter)",
    description: "Tweets, threads et médias — 280 caractères par post.",
    Icon: TwitterXIcon,
    color: "text-foreground",
    bgColor: "bg-foreground/8 dark:bg-foreground/10",
    borderColor: "border-foreground/10",
    phase: "MVP",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Contenu professionnel sur votre profil et pages entreprise — 3 000 caractères.",
    Icon: LinkedInIcon,
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
    borderColor: "border-[#0A66C2]/20",
    phase: "MVP",
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Photos, reels et stories sur vos comptes professionnels — 2 200 caractères.",
    Icon: InstagramIcon,
    color: "text-[#E1306C]",
    bgColor: "bg-[#E1306C]/10",
    borderColor: "border-[#E1306C]/20",
    phase: "MVP",
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Pages Facebook avec ciblage d'audience et publication planifiée.",
    Icon: FacebookIcon,
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    borderColor: "border-[#1877F2]/20",
    phase: "MVP",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    description: "Épingles visuelles sur vos tableaux — contenu evergreen haute durée de vie.",
    Icon: PinterestIcon,
    color: "text-[#E60023]",
    bgColor: "bg-[#E60023]/10",
    borderColor: "border-[#E60023]/20",
    phase: "MVP",
  },
]

const COMING_SOON: Array<{ id: string; label: string; icon: string; eta: string }> = [
  { id: "tiktok", label: "TikTok", icon: "🎵", eta: "Phase 2" },
  { id: "youtube", label: "YouTube", icon: "▶", eta: "Phase 2" },
  { id: "mastodon", label: "Mastodon", icon: "🐘", eta: "Phase 2" },
]

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConnectionStatus }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5" />
        Connecté
      </span>
    )
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
        <AlertCircle className="size-3.5" />
        Token expiré
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span className="size-2 rounded-full border-2 border-current opacity-50" />
      Non connecté
    </span>
  )
}

// ─── PlatformCard ────────────────────────────────────────────────────────────

function PlatformCard({
  platform,
  connection,
}: {
  platform: Platform
  connection?: OAuthConnection
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  // État optimiste : masque la carte comme "déconnecté" avant le rechargement
  const [optimisticDisconnected, setOptimisticDisconnected] = React.useState(false)

  const rawStatus: ConnectionStatus = connection?.status ?? "disconnected"
  const status: ConnectionStatus = optimisticDisconnected ? "disconnected" : rawStatus
  const isConnected = status === "connected"
  const isError = status === "error"

  const oauthPath = `/api/oauth/${platform.id}/authorize`

  function handleConnect() {
    window.location.href = oauthPath
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
        "group relative flex items-start gap-4 rounded-2xl border bg-card p-5 transition-all duration-200",
        isConnected
          ? "border-emerald-500/20 shadow-[0_0_0_1px] shadow-emerald-500/10 hover:shadow-emerald-500/20"
          : isError
          ? "border-amber-500/20 hover:border-amber-500/30"
          : "border-border hover:border-primary/20 hover:shadow-sm"
      )}
    >
      {/* Point d'état connecté */}
      {isConnected && (
        <div className="absolute right-4 top-4 size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_2px] shadow-emerald-500/40" />
      )}

      {/* Icône plateforme */}
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-xl border",
          platform.bgColor,
          platform.borderColor,
          isConnected && "shadow-sm"
        )}
      >
        <platform.Icon className={cn("size-5", platform.color)} />
      </div>

      {/* Infos */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className="font-semibold text-foreground">{platform.label}</span>
          <StatusBadge status={status} />
        </div>

        {isConnected && connection?.accountName ? (
          <div className="flex items-center gap-2 mt-1">
            {connection.accountAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={connection.accountAvatar}
                alt={connection.accountName}
                className="size-5 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className={cn("flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white", platform.bgColor)}>
                {connection.accountName.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-sm">
              <span className="font-medium text-foreground">{connection.accountName}</span>
              {connection.connectedAt && (
                <span className="ml-2 text-xs text-muted-foreground">
                  · depuis le{" "}
                  {new Date(connection.connectedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </p>
          </div>
        ) : isError ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Token expiré — reconnectez votre compte pour continuer à publier.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{platform.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {status === "disconnected" && (
          <Button variant="outline" size="sm" onClick={handleConnect} className="gap-1.5">
            <ExternalLink className="size-3.5" />
            Connecter
          </Button>
        )}

        {isError && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            className="gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-50 hover:border-amber-500/50 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <RefreshCw className="size-3.5" />
            Reconnecter
          </Button>
        )}

        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={handleDisconnect}
            className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          >
            {loading ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Unplug className="size-3.5" />
            )}
            {loading ? "…" : "Déconnecter"}
          </Button>
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
  const connectionMap = React.useMemo(() => {
    const map = new Map<string, OAuthConnection>()
    for (const conn of initialConnections) {
      map.set(conn.platformId, conn)
    }
    return map
  }, [initialConnections])

  const hasError = initialConnections.some((c) => c.status === "error")

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Alerte tokens expirés */}
      {hasError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Des tokens OAuth ont expiré
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">
              Reconnectez les comptes concernés pour rétablir la publication automatique.
            </p>
          </div>
        </div>
      )}

      {/* Vide : aucun compte */}
      {initialConnections.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-2">
          <Zap className="size-8 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-medium text-foreground">Aucun compte connecté</p>
          <p className="text-xs text-muted-foreground">
            Connectez vos comptes sociaux pour publier depuis le workflow RAMI en 1 clic.
          </p>
        </div>
      )}

      {/* Plateformes MVP */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Plateformes disponibles
        </p>
        {PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            connection={connectionMap.get(platform.id)}
          />
        ))}
      </div>

      {/* Plateformes à venir */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Clock className="size-3" />
          Bientôt disponibles
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {COMING_SOON.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-3 opacity-60"
            >
              <span className="text-xl">{p.icon}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{p.label}</p>
                <p className="text-[10px] text-muted-foreground">{p.eta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note sécurité */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <span className="text-base">🔒</span>
        <p className="text-xs text-muted-foreground">
          Vos tokens OAuth sont chiffrés AES-256-GCM avant stockage et ne sont jamais partagés avec des tiers.
          La déconnexion révoque l&apos;accès immédiatement côté plateforme.
        </p>
      </div>
    </div>
  )
}
