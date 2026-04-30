"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ClipboardCheck, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ApprovalCard,
  type ApprovalItem,
  type ApprovalStatus,
} from "./approval-card"

// ── Données mock MVP ─────────────────────────────────────────────────────────

const MOCK_ITEMS: ApprovalItem[] = [
  // En attente
  {
    id: "1",
    content: "Nouvelle collection printemps 2026 ! Découvrez nos pièces phares inspirées des tendances méditerranéennes. Chaque détail a été pensé pour allier confort et élégance.",
    platform: "instagram",
    thumbnailUrl: "/mock-thumb-1.jpg",
    authorName: "Sarah Benali",
    submittedAt: "2026-03-12T10:30:00Z",
    status: "pending_approval",
    comment: "",
  },
  {
    id: "2",
    content: "Comment l'IA transforme le marketing B2B au Maroc en 2026 ? 5 tendances clés à surveiller pour garder une longueur d'avance sur la concurrence.",
    platform: "linkedin",
    thumbnailUrl: null,
    authorName: "Karim Tazi",
    submittedAt: "2026-03-11T14:00:00Z",
    status: "pending_approval",
    comment: "",
  },
  {
    id: "3",
    content: "Thread : Les 7 erreurs les plus courantes en stratégie social media et comment les éviter. Un guide pratique pour les entrepreneurs.",
    platform: "twitter",
    thumbnailUrl: null,
    authorName: "Fatima Ouardi",
    submittedAt: "2026-03-13T09:15:00Z",
    status: "pending_approval",
    comment: "",
  },
  {
    id: "4",
    content: "Recette exclusive : notre fondateur partage sa vision du branding authentique pour les marques africaines. Vidéo complète sur notre chaîne.",
    platform: "youtube",
    thumbnailUrl: "/mock-thumb-2.jpg",
    authorName: "Youssef Alami",
    submittedAt: "2026-03-10T16:45:00Z",
    status: "pending_approval",
    comment: "",
  },
  // Approuvé
  {
    id: "5",
    content: "Étude de cas : comment nous avons augmenté l'engagement de 340 % pour un client dans le secteur agroalimentaire en seulement 3 mois.",
    platform: "linkedin",
    thumbnailUrl: "/mock-thumb-3.jpg",
    authorName: "Karim Tazi",
    submittedAt: "2026-03-09T11:00:00Z",
    status: "approved",
    comment: "Excellent contenu, à publier mardi matin.",
  },
  {
    id: "6",
    content: "Notre nouveau tableau d'inspiration pour vos projets créatifs. Couleurs tendances, typographies modernes et compositions innovantes.",
    platform: "pinterest",
    thumbnailUrl: "/mock-thumb-4.jpg",
    authorName: "Sarah Benali",
    submittedAt: "2026-03-08T08:30:00Z",
    status: "approved",
    comment: "",
  },
  {
    id: "7",
    content: "Atelier gratuit ce vendredi : Maîtrisez votre identité visuelle en 2h. Inscriptions ouvertes, places limitées !",
    platform: "facebook",
    thumbnailUrl: null,
    authorName: "Fatima Ouardi",
    submittedAt: "2026-03-07T15:20:00Z",
    status: "approved",
    comment: "Vérifier la date avant publication.",
  },
  // Rejeté
  {
    id: "8",
    content: "Promo flash -50 % sur tous nos services ! Offre limitée, dépêchez-vous !",
    platform: "instagram",
    thumbnailUrl: "/mock-thumb-5.jpg",
    authorName: "Youssef Alami",
    submittedAt: "2026-03-06T12:00:00Z",
    status: "rejected",
    comment: "Ton trop agressif, ne correspond pas au Brand DNA. Reformuler avec une approche plus premium.",
  },
  {
    id: "9",
    content: "On recrute ! Rejoignez notre équipe de créatifs passionnés. Envoyez votre CV à contact@example.com.",
    platform: "twitter",
    thumbnailUrl: null,
    authorName: "Sarah Benali",
    submittedAt: "2026-03-05T09:00:00Z",
    status: "rejected",
    comment: "Utiliser le lien du formulaire de recrutement plutôt qu'un email direct.",
  },
  {
    id: "10",
    content: "Journée mondiale du design graphique — retour sur les créations qui ont marqué notre agence cette année.",
    platform: "mastodon",
    thumbnailUrl: null,
    authorName: "Karim Tazi",
    submittedAt: "2026-03-04T17:30:00Z",
    status: "rejected",
    comment: "Ajouter des visuels pour illustrer les créations mentionnées.",
  },
]

// ── Config colonnes ──────────────────────────────────────────────────────────

const COLUMNS: { status: ApprovalStatus; labelKey: string; color: string }[] = [
  { status: "pending_approval", labelKey: "pending", color: "text-amber-500" },
  { status: "approved", labelKey: "approved", color: "text-emerald-500" },
  { status: "rejected", labelKey: "rejected", color: "text-red-500" },
]

// ── Composant ────────────────────────────────────────────────────────────────

export function ApprovalBoard() {
  const t = useTranslations("approvals")
  const [items, setItems] = useState<ApprovalItem[]>(MOCK_ITEMS)

  const handleApprove = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "approved" as ApprovalStatus } : item
      )
    )
  }, [])

  const handleReject = useCallback((id: string, comment: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "rejected" as ApprovalStatus, comment }
          : item
      )
    )
  }, [])

  const handlePublish = useCallback((id: string) => {
    // MVP : placeholder — à connecter au publishing layer
    toast.info(t("publishPlaceholder"))
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [t])

  const handleEdit = useCallback((id: string) => {
    // MVP : placeholder — à connecter au workflow d'édition
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "pending_approval" as ApprovalStatus }
          : item
      )
    )
  }, [])

  const handleUpdateComment = useCallback((id: string, comment: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, comment } : item
      )
    )
  }, [])

  const getItemsByStatus = (status: ApprovalStatus) =>
    items.filter((item) => item.status === status)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardCheck className="size-5 text-violet-500" />
          <h1 className="text-xl font-bold text-foreground dark:text-white">
            {t("title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnItems = getItemsByStatus(col.status)

          return (
            <div key={col.status} className="flex flex-col">
              {/* Column header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      col.color
                    )}
                  >
                    {t(col.labelKey)}
                  </span>
                  <span className="inline-flex items-center justify-center size-5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                    {columnItems.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-3 min-h-[200px]">
                {columnItems.length > 0 ? (
                  columnItems.map((item) => (
                    <ApprovalCard
                      key={item.id}
                      item={item}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onPublish={handlePublish}
                      onEdit={handleEdit}
                      onUpdateComment={handleUpdateComment}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-border glass-card">
                    <Inbox className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("noItems")}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 text-center px-4">
                      {t("noItemsDesc")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
