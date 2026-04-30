import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Sparkles,
  Wand2,
  CalendarDays,
  Images,
  BarChart3,
  CheckSquare,
  FileText,
  Mic,
  Users,
  CreditCard,
  Settings,
  Video,
  Palette,
} from "lucide-react"

export interface NavItem {
  href: string
  labelKey: string
  icon: LucideIcon
  badgeKey?: string
}

export const navMain: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/brand-dna", labelKey: "brandDna", icon: Sparkles },
  { href: "/dashboard/create", labelKey: "createPost", icon: Wand2 },
  { href: "/create", labelKey: "visualsAi", icon: Palette },
  { href: "/create/video", labelKey: "videoAi", icon: Video, badgeKey: "new" },
  { href: "/dashboard/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/dashboard/library", labelKey: "library", icon: Images },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/dashboard/approvals", labelKey: "approvals", icon: CheckSquare },
]

export const navAdvanced: NavItem[] = [
  { href: "/dashboard/documents", labelKey: "documents", icon: FileText, badgeKey: "agency" },
  { href: "/dashboard/transcriptions", labelKey: "transcriptions", icon: Mic, badgeKey: "pro" },
  { href: "/dashboard/leads", labelKey: "leads", icon: Users, badgeKey: "agency" },
  { href: "/billing", labelKey: "billing", icon: CreditCard, badgeKey: "agency" },
]

export const navBottom: NavItem[] = [
  { href: "/settings", labelKey: "settings", icon: Settings },
]
