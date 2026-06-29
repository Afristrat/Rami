"use client"

// ============================================================
// Aperçu fidèle multi-plateforme (Pilier 2 — validation humaine)
// Rend le post tel qu'il apparaîtra dans le feed de chaque réseau : en-tête de
// compte, ratio d'image correct, troncature à la limite réelle, points de
// carrousel, hashtags. Avertissements de conformité calculés (jamais de fausse
// métrique d'engagement). Réutilisé dans le workflow ET la page de validation.
// ============================================================

import { useState } from "react"
import {
  PLATFORM_CONFIG,
  aspectRatioToCss,
  checkPlatformConformity,
  type Platform,
} from "@/lib/scheduler/platform-config"

export interface PlatformPreviewProps {
  platform: Platform
  content: string
  mediaUrls?: string[]
  hashtags?: string[]
  accountName?: string
  accountAvatarUrl?: string | null
}

// Archétype de mise en page par plateforme
function layoutOf(platform: Platform): "feed" | "tweet" | "square" | "vertical" | "pin" | "video" {
  switch (platform) {
    case "twitter":
      return "tweet"
    case "instagram":
      return "square"
    case "tiktok":
      return "vertical"
    case "pinterest":
      return "pin"
    case "youtube":
      return "video"
    default:
      return "feed" // linkedin, facebook
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "M"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Avatar({ name, url, color }: { name: string; url?: string | null; color: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- aperçu : <img> simple, pas d'optimisation next/image (domaines MinIO variables)
    return <img src={url} alt={name} className="h-10 w-10 rounded-full object-cover" />
  }
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </div>
  )
}

function Media({
  urls,
  cssRatio,
  rounded = true,
}: {
  urls: string[]
  cssRatio: string
  rounded?: boolean
}) {
  const [active, setActive] = useState(0)
  if (urls.length === 0) return null
  const current = urls[Math.min(active, urls.length - 1)]
  return (
    <div className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${rounded ? "rounded-lg" : ""}`}>
      <div style={{ aspectRatio: cssRatio }} className="w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- aperçu fidèle */}
        <img src={current} alt="Aperçu du visuel" className="h-full w-full object-cover" />
      </div>
      {urls.length > 1 && (
        <>
          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {active + 1}/{urls.length}
          </div>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Caption({ content, hashtags }: { content: string; hashtags: string[] }) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
      {content}
      {hashtags.length > 0 && (
        <span className="text-[#0A66C2] dark:text-sky-400">
          {" "}
          {hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
        </span>
      )}
    </p>
  )
}

export function PlatformPreview({
  platform,
  content,
  mediaUrls = [],
  hashtags = [],
  accountName = "Votre marque",
  accountAvatarUrl,
}: PlatformPreviewProps) {
  const cfg = PLATFORM_CONFIG[platform]
  const layout = layoutOf(platform)
  const images = mediaUrls.filter((u) => /^https?:\/\//.test(u))
  const cssRatio = aspectRatioToCss(cfg.aspectRatios[0])

  // Troncature à la limite réelle de la plateforme (fidélité)
  const over = content.length > cfg.charLimit
  const shown = over ? content.slice(0, cfg.charLimit) : content
  const issues = checkPlatformConformity(platform, { content, imageCount: images.length })

  const header = (
    <div className="flex items-center gap-2.5">
      <Avatar name={accountName} url={accountAvatarUrl} color={cfg.color} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{accountName}</div>
        <div className="truncate text-xs text-zinc-500">À l&apos;instant · 🌐</div>
      </div>
    </div>
  )

  let body: React.ReactNode

  if (layout === "tweet") {
    body = (
      <div className="flex gap-3">
        <Avatar name={accountName} url={accountAvatarUrl} color={cfg.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{accountName}</span>
            <span className="text-zinc-500">@{accountName.toLowerCase().replace(/\s+/g, "")} · 1h</span>
          </div>
          <div className="mt-1">
            <Caption content={shown} hashtags={hashtags} />
          </div>
          {images.length > 0 && (
            <div className="mt-2">
              <Media urls={images} cssRatio={cssRatio} />
            </div>
          )}
        </div>
      </div>
    )
  } else if (layout === "square") {
    body = (
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <Avatar name={accountName} url={accountAvatarUrl} color={cfg.color} />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {accountName.toLowerCase().replace(/\s+/g, "_")}
          </span>
        </div>
        {images.length > 0 ? (
          <Media urls={images} cssRatio={aspectRatioToCss("1:1")} rounded={false} />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400 dark:border-zinc-700">
            Instagram exige une image
          </div>
        )}
        <div className="mt-2 flex gap-3 text-zinc-700 dark:text-zinc-300">♡ 💬 ✈</div>
        <div className="mt-1">
          <Caption content={shown} hashtags={hashtags} />
        </div>
      </div>
    )
  } else if (layout === "vertical" || layout === "pin") {
    body = (
      <div className="relative mx-auto max-w-[260px] overflow-hidden rounded-xl bg-black">
        <div style={{ aspectRatio: cssRatio }} className="w-full">
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu fidèle
            <img src={images[0]} alt="Aperçu" className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              Média requis
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="mb-1 text-xs font-semibold text-white">{accountName}</div>
          <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs text-white/90">{shown}</p>
        </div>
      </div>
    )
  } else if (layout === "video") {
    body = (
      <div>
        {images.length > 0 ? (
          <Media urls={[images[0]]} cssRatio={aspectRatioToCss("16:9")} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg bg-zinc-200 text-xs text-zinc-500 dark:bg-zinc-800">
            Miniature vidéo
          </div>
        )}
        <div className="mt-2 flex gap-2.5">
          <Avatar name={accountName} url={accountAvatarUrl} color={cfg.color} />
          <div className="min-w-0">
            <div className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{shown.split("\n")[0]}</div>
            <div className="text-xs text-zinc-500">{accountName} · à l&apos;instant</div>
          </div>
        </div>
      </div>
    )
  } else {
    // feed : linkedin, facebook
    body = (
      <div>
        {header}
        <div className="mt-2.5">
          <Caption content={shown} hashtags={hashtags} />
        </div>
        {images.length > 0 && (
          <div className="mt-2.5">
            <Media urls={images} cssRatio={cssRatio} rounded={false} />
          </div>
        )}
        <div className="mt-2 flex gap-4 border-t border-zinc-100 pt-2 text-xs text-zinc-500 dark:border-zinc-800">
          👍 J&apos;aime · 💬 Commenter · ↪ Partager
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: `${cfg.color}1A`, color: cfg.color }}
        >
          <span aria-hidden>{cfg.icon}</span> {cfg.label}
        </span>
        <span className={`text-xs ${over ? "font-semibold text-red-500" : "text-zinc-400"}`}>
          {content.length}/{cfg.charLimit}
        </span>
      </div>

      {body}

      {issues.length > 0 && (
        <ul className="mt-3 space-y-1">
          {issues.map((issue, i) => (
            <li
              key={i}
              className={`flex items-start gap-1.5 text-xs ${
                issue.level === "error" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              <span aria-hidden>{issue.level === "error" ? "⛔" : "⚠️"}</span>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
