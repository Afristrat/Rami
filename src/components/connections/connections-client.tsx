"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Unplug } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { disconnectConnectionAction, type OAuthConnection } from "@/lib/actions/connections.actions"
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
  phase: "MVP" | "Phase 2"
}

// ─── Plateformes disponibles ──────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
  {
    id: "twitter",
    label: "X (Twitter)",
    description: "Publiez des tweets, threads et médias directement depuis RAMI.",
    Icon: TwitterXIcon,
    color: "text-[#000000] dark:text-white",
    bgColor: "bg-[#000000]/10 dark:bg-white/10",
    phase: "MVP",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Partagez du contenu professionnel sur votre profil et vos pages d'entreprise.",
    Icon: LinkedInIcon,
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
    phase: "MVP",
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Publiez des photos, reels et stories sur vos comptes professionnels.",
    Icon: InstagramIcon,
    color: "text-[#E1306C]",
    bgColor: "bg-[#E1306C]/10",
    phase: "MVP",
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Gérez vos pages Facebook et publiez du contenu ciblé.",
    Icon: FacebookIcon,
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    phase: "MVP",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    description: "Épinglez du contenu visuel sur vos tableaux Pinterest.",
    Icon: PinterestIcon,
    color: "text-[#E60023]",
    bgColor: "bg-[#E60023]/10",
    phase: "MVP",
  },
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
  const [loading, setLoading] = React.useState(false)
  const status: ConnectionStatus = connection?.status ?? "disconnected"
  const isConnected = status === "connected"

  const oauthPath = `/api/oauth/${platform.id}/authorize`

  function handleConnect() {
    window.location.href = oauthPath
  }

  async function handleDisconnect() {
    if (!connection?.id) return
    setLoading(true)
    await disconnectConnectionAction(connection.id)
    setLoading(false)
  }

  function handleReconnect() {
    window.location.href = oauthPath
  }

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-shadow",
        isConnected && "ring-1 ring-emerald-500/20",
        status === "error" && "ring-1 ring-destructive/20"
      )}
    >
      {/* Icône plateforme */}
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          platform.bgColor
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
          <p className="text-sm text-muted-foreground">
            Compte :{" "}
            <span className="font-medium text-foreground">{connection.accountName}</span>
            {connection.connectedAt && (
              <span className="ml-2 opacity-60">
                · depuis le{" "}
                {new Date(connection.connectedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{platform.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {status === "disconnected" && (
          <Button variant="outline" size="sm" onClick={handleConnect}>
            <ExternalLink className="size-3.5" />
            Connecter
          </Button>
        )}

        {status === "error" && (
          <Button variant="outline" size="sm" onClick={handleReconnect}>
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
            className="text-muted-foreground hover:text-destructive"
          >
            {loading ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Unplug className="size-3.5" />
            )}
            Déconnecter
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

  const connectedCount = initialConnections.filter(
    (c) => c.status === "connected"
  ).length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Résumé */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{connectedCount}</span>{" "}
          compte{connectedCount !== 1 ? "s" : ""} connecté
          {connectedCount !== 1 ? "s" : ""} sur{" "}
          <span className="font-semibold text-foreground">{PLATFORMS.length}</span>{" "}
          plateformes disponibles.
        </p>
      </div>

      {/* Liste des plateformes */}
      <div className="space-y-3">
        {PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            connection={connectionMap.get(platform.id)}
          />
        ))}
      </div>

      {/* Note sécurité */}
      <p className="text-xs text-muted-foreground">
        Vos identifiants OAuth sont chiffrés AES-256 et ne sont jamais partagés.
        La déconnexion révoque l&apos;accès immédiatement.
      </p>
    </div>
  )
}
