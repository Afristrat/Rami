import type { ElementType } from "react"
import {
  FileText,
  Mic2,
  Image as ImageIcon,
  Film,
  Download,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Settings2,
  Zap,
  Monitor,
  Smartphone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTranslations } from "next-intl/server"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("video"),
    description: t("videoDescription"),
  }
}

/* -- Pipeline steps ------------------------------------------------- */

interface PipelineStep {
  id: string
  label: string
  icon: ElementType
  status: "completed" | "active" | "pending"
  duration: string
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: "brief", label: "Brief", icon: FileText, status: "completed", duration: "2min" },
  { id: "script", label: "Script", icon: FileText, status: "completed", duration: "CLAUDE V4" },
  { id: "voice", label: "Voice", icon: Mic2, status: "active", duration: "ELEVENLABS" },
  { id: "storyboard", label: "Storyboard", icon: Layers, status: "pending", duration: "CLAUDE" },
  { id: "imagegen", label: "Image Gen", icon: ImageIcon, status: "pending", duration: "FAL AI" },
  { id: "animation", label: "Animation", icon: Film, status: "pending", duration: "RUNWAY" },
  { id: "export", label: "Export", icon: Download, status: "pending", duration: "MP4" },
]

/* -- Script mock ---------------------------------------------------- */

const SCRIPT_SECTIONS = [
  { id: "1", label: "HOOK", text: "\"Are you tired of spending hours on social media content?\"", status: "completed" as const },
  { id: "2", label: "PROBLEM", text: "Traditional workflows are slow and disconnected. You switch between 5 tools to publish a single post. It doesn't scale.", status: "completed" as const },
  { id: "3", label: "AGITATION", text: "Imagine losing clients because your content looks generic. They can feel the lack of strategic intent behind every visual.", status: "completed" as const },
  { id: "4", label: "SOLUTION", text: "Enter RAMI. The script is that neuro-optimized...", status: "active" as const },
  { id: "5", label: "CTA", text: "Generate your SLIDE videos and sounds below.", status: "pending" as const },
  { id: "6", label: "OUTRO", text: "Ready to transform your agency's content game?", status: "pending" as const },
]

/* -- Voice actors --------------------------------------------------- */

const VOICE_ACTORS = [
  { id: "adam", name: "Adam (Pro)", style: "Professionnel", active: true },
  { id: "sofia", name: "Sofia", style: "Dynamique", active: false },
]

/* -- Storyboard frames ---------------------------------------------- */

const STORYBOARD_FRAMES = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  status: i < 8 ? "generated" : "pending" as "generated" | "pending",
}))

/* -- Page ----------------------------------------------------------- */

export default async function VideoPipelinePage() {
  const t = await getTranslations("video.pipeline")

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">{t("breadcrumb")}</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
          {t("title").split("—")[0]} — <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">{t("title").split("—")[1]?.trim()}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl">
          {t("subtitle")}
        </p>
      </div>

      {/* Pipeline stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {PIPELINE_STEPS.map((step, idx) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex flex-col items-center gap-1.5 min-w-[80px]",
                )}
              >
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl transition-all",
                    step.status === "completed"
                      ? "bg-violet-500/20 border border-violet-500/40"
                      : step.status === "active"
                        ? "bg-violet-500 border border-violet-400 shadow-lg shadow-violet-500/20"
                        : "bg-white/[0.04] border border-white/[0.08] dark:bg-white/[0.04] dark:border-white/[0.08]"
                  )}
                >
                  <Icon className={cn(
                    "size-5",
                    step.status === "completed" ? "text-violet-400" :
                    step.status === "active" ? "text-white" :
                    "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold",
                  step.status === "active" ? "text-violet-400" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                <span className="text-[8px] text-muted-foreground uppercase tracking-wider">{step.duration}</span>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <div className={cn(
                  "h-px w-6 flex-shrink-0",
                  step.status === "completed" ? "bg-violet-500/40" : "bg-white/[0.06]"
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Main content: 3 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Script structure */}
        <div
          className={cn(
            "rounded-2xl p-5",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground dark:text-white">{t("scriptStructure")}</h3>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              CLAUDE V4
            </span>
          </div>
          <div className="space-y-3">
            {SCRIPT_SECTIONS.map((section) => (
              <div
                key={section.id}
                className={cn(
                  "rounded-xl p-3",
                  "bg-gray-50 border border-gray-200/60",
                  "dark:bg-white/[0.03] dark:border-white/[0.06]",
                  section.status === "active" && "ring-1 ring-violet-500/30"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                    {section.label}
                  </span>
                  {section.status === "completed" && <CheckCircle2 className="size-3 text-emerald-400" />}
                  {section.status === "active" && <div className="size-2 rounded-full bg-violet-500 animate-pulse" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">
            <Zap className="inline size-3 mr-1 text-amber-400" />
            Claude 4.5 Haiku CONNECTED · Runway API ACTIVE
          </p>
        </div>

        {/* Voice & Audio */}
        <div
          className={cn(
            "rounded-2xl p-5",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground dark:text-white">{t("voiceAndAudio")}</h3>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ELEVENLABS
            </span>
          </div>

          {/* Voice selection */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("voiceSelection")}
          </p>
          <div className="flex items-center gap-2 mb-4">
            {VOICE_ACTORS.map((va) => (
              <button
                key={va.id}
                className={cn(
                  "inline-flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium transition-all",
                  va.active
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    : "bg-gray-100 text-muted-foreground border border-gray-200/60 dark:bg-white/[0.04] dark:border-white/[0.08]"
                )}
              >
                <div className={cn("size-5 rounded-full", va.active ? "bg-violet-500" : "bg-gray-300 dark:bg-white/10")} />
                {va.name}
              </button>
            ))}
          </div>

          {/* Audio waveform */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("audioNarration")}
          </p>
          <div
            className={cn(
              "rounded-xl p-3 mb-4",
              "bg-gray-50 border border-gray-200/60",
              "dark:bg-white/[0.03] dark:border-white/[0.06]"
            )}
          >
            <div className="flex items-end gap-px h-16">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-full min-w-[2px]",
                    i < 20 ? "bg-violet-500" : "bg-gray-300 dark:bg-white/10"
                  )}
                  style={{ height: `${20 + ((i * 37 + 13) % 80)}%`, minHeight: "4px" }}
                />
              ))}
            </div>
          </div>

          {/* Background ambiance */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("backgroundAmbiance")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-white/[0.06]">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
            </div>
            <span className="text-[10px] text-muted-foreground">35%</span>
          </div>
        </div>

        {/* Visual Storyboard */}
        <div
          className={cn(
            "rounded-2xl p-5",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground dark:text-white">{t("visualStoryboard")}</h3>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {STORYBOARD_FRAMES.map((frame) => (
              <div
                key={frame.id}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono transition-all",
                  frame.status === "generated"
                    ? "bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20"
                    : "bg-gray-100 border border-gray-200/60 dark:bg-white/[0.03] dark:border-white/[0.06]"
                )}
              >
                {frame.status === "generated" ? (
                  <ImageIcon className="size-4 text-violet-400/50" />
                ) : (
                  <span className="text-muted-foreground/30">{frame.id}</span>
                )}
              </div>
            ))}
          </div>
          <button
            className={cn(
              "mt-4 w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-colors",
              "border border-gray-200/60 bg-white text-foreground hover:bg-gray-50",
              "dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]"
            )}
          >
            <RefreshCw className="size-4" />
            {t("regenerateAll")}
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            {t("production")}
          </p>
        </div>
      </div>

      {/* Export settings + Generate CTA */}
      <div
        className={cn(
          "rounded-2xl p-5",
          "bg-white border border-gray-200/60 shadow-sm",
          "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground dark:text-white">{t("exportSettings")}</h3>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Platform badges */}
            <div className="flex items-center gap-2">
              {[
                { label: "9:16 (TikTok/Reels)", icon: Smartphone },
                { label: "16:9 (YouTube/LinkedIn)", icon: Monitor },
              ].map((fmt) => (
                <div
                  key={fmt.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[10px] font-medium",
                    "bg-gray-100 border border-gray-200/60 text-muted-foreground",
                    "dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white/50"
                  )}
                >
                  <fmt.icon className="size-3" />
                  {fmt.label}
                </div>
              ))}
            </div>

            {/* Resolution & FPS */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">RESOLUTION</span>
                <span className={cn(
                  "inline-flex items-center h-6 px-2 rounded text-[10px] font-bold",
                  "bg-violet-500/20 text-violet-400"
                )}>
                  1080p (Full)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">FRAME RATE</span>
                <span className={cn(
                  "inline-flex items-center h-6 px-2 rounded text-[10px] font-bold",
                  "bg-blue-500/20 text-blue-400"
                )}>
                  30 fps
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">{t("estimatedTime")}</p>
            </div>
            <button
              className={cn(
                "inline-flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-bold text-white",
                "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity",
                "shadow-lg shadow-violet-500/20"
              )}
            >
              <Sparkles className="size-4" />
              {t("generatePipeline")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
