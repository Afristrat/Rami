import { Camera, BookOpen, Type, List, Grid3X3, Newspaper, Scale, Award } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface CampaignType {
  id: string
  labelKey: string  // i18n key under "visuals.campaigns"
  descriptionKey: string
  icon: LucideIcon
  promptModifier: string  // injected into the prompt compiler
  suggestedPlatforms: string[]
}

export const CAMPAIGN_TYPES: CampaignType[] = [
  {
    id: "lifestyle",
    labelKey: "lifestyle",
    descriptionKey: "lifestyleDesc",
    icon: Camera,
    promptModifier: "lifestyle photography, product in natural environment, authentic moment, real-life setting",
    suggestedPlatforms: ["instagram", "facebook", "pinterest"],
  },
  {
    id: "story",
    labelKey: "story",
    descriptionKey: "storyDesc",
    icon: BookOpen,
    promptModifier: "vertical story format, short narrative, emotional hook, sequential visual storytelling",
    suggestedPlatforms: ["instagram", "tiktok"],
  },
  {
    id: "text_first",
    labelKey: "textFirst",
    descriptionKey: "textFirstDesc",
    icon: Type,
    promptModifier: "bold typography as hero element, text-centric design, impactful quote layout, minimal imagery",
    suggestedPlatforms: ["linkedin", "twitter", "facebook"],
  },
  {
    id: "listicle",
    labelKey: "listicle",
    descriptionKey: "listicleDesc",
    icon: List,
    promptModifier: "numbered list layout, clean infographic style, easy-to-scan visual hierarchy, fact-based design",
    suggestedPlatforms: ["linkedin", "pinterest", "instagram"],
  },
  {
    id: "montage",
    labelKey: "montage",
    descriptionKey: "montageDesc",
    icon: Grid3X3,
    promptModifier: "photo collage layout, multi-frame composition, editorial grid, visual storytelling through multiple images",
    suggestedPlatforms: ["instagram", "facebook", "pinterest"],
  },
  {
    id: "press",
    labelKey: "press",
    descriptionKey: "pressDesc",
    icon: Newspaper,
    promptModifier: "press coverage highlight, testimonial layout, credibility-focused design, social proof visual",
    suggestedPlatforms: ["linkedin", "twitter", "facebook"],
  },
  {
    id: "comparison",
    labelKey: "comparison",
    descriptionKey: "comparisonDesc",
    icon: Scale,
    promptModifier: "before-after layout, side-by-side comparison, competitive advantage visualization, split-screen design",
    suggestedPlatforms: ["linkedin", "instagram", "facebook"],
  },
  {
    id: "case_study",
    labelKey: "caseStudy",
    descriptionKey: "caseStudyDesc",
    icon: Award,
    promptModifier: "success story layout, metrics highlight, client results showcase, professional case study design",
    suggestedPlatforms: ["linkedin", "facebook"],
  },
]
