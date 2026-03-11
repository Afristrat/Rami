import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Sparkles,
  Wand2,
  CalendarDays,
  Images,
  BarChart3,
  FileText,
  Mic,
  Users,
  CreditCard,
  Settings,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
}

export const navMain: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/brand-dna", label: "Brand DNA", icon: Sparkles },
  { href: "/dashboard/create", label: "Créer", icon: Wand2 },
  { href: "/dashboard/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/dashboard/library", label: "Bibliothèque", icon: Images },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
]

export const navAdvanced: NavItem[] = [
  { href: "/dashboard/documents", label: "Documents", icon: FileText, badge: "Agency" },
  { href: "/dashboard/transcriptions", label: "Transcriptions", icon: Mic, badge: "Pro" },
  { href: "/dashboard/leads", label: "Leads", icon: Users, badge: "Agency" },
  { href: "/dashboard/billing", label: "Facturation", icon: CreditCard, badge: "Agency" },
]

export const navBottom: NavItem[] = [
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
]
