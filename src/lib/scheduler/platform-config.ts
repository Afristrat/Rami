export type Platform =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "pinterest"
  | "mastodon"
  | "youtube"
  | "tiktok"

export interface PlatformConfig {
  label: string
  color: string      // hex pour les chips calendrier
  bgClass: string    // classe Tailwind pour fond badge
  textClass: string  // classe Tailwind pour texte badge
  icon: string       // emoji fallback
  charLimit: number
}

export const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  twitter: {
    label: "X / Twitter",
    color: "#1D9BF0",
    bgClass: "bg-[#1D9BF0]/15",
    textClass: "text-[#1D9BF0]",
    icon: "𝕏",
    charLimit: 280,
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    bgClass: "bg-[#0A66C2]/15",
    textClass: "text-[#0A66C2]",
    icon: "in",
    charLimit: 3000,
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    bgClass: "bg-[#1877F2]/15",
    textClass: "text-[#1877F2]",
    icon: "f",
    charLimit: 63206,
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    bgClass: "bg-[#E1306C]/15",
    textClass: "text-[#E1306C]",
    icon: "📸",
    charLimit: 2200,
  },
  pinterest: {
    label: "Pinterest",
    color: "#E60023",
    bgClass: "bg-[#E60023]/15",
    textClass: "text-[#E60023]",
    icon: "P",
    charLimit: 500,
  },
  mastodon: {
    label: "Mastodon",
    color: "#6364FF",
    bgClass: "bg-[#6364FF]/15",
    textClass: "text-[#6364FF]",
    icon: "M",
    charLimit: 500,
  },
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    bgClass: "bg-[#FF0000]/15",
    textClass: "text-[#FF0000]",
    icon: "▶",
    charLimit: 5000,
  },
  tiktok: {
    label: "TikTok",
    color: "#010101",
    bgClass: "bg-zinc-900/10 dark:bg-zinc-100/10",
    textClass: "text-zinc-900 dark:text-zinc-100",
    icon: "♪",
    charLimit: 2200,
  },
}

export const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIG) as Platform[]
