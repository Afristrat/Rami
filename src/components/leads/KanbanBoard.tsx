"use client"

import { useState, useCallback, useTransition, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateLeadAction } from "@/lib/actions/leads.actions"
import {
  LEAD_STAGES,
  STAGE_CONFIG,
  type LeadStage,
  type LeadData,
  type LeadsByStage,
} from "@/lib/schemas/lead.schema"
import { LeadCard } from "./LeadCard"
import { LeadDetailPanel } from "./LeadDetailPanel"
import { AddLeadDialog } from "./AddLeadDialog"

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", { style: "decimal" }).format(amount) + " MAD"
}

function getStageTotal(leads: LeadData[]): number {
  return leads.reduce((sum, l) => sum + (l.deal_value ?? 0), 0)
}

/** Trie une colonne par score Brand DNA décroissant (non scorés en dernier). */
function sortByScore(leads: LeadData[]): LeadData[] {
  return [...leads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  initialData: LeadsByStage
  searchQuery: string
}

// ── Composant ──────────────────────────────────────────────────────────────────

export function KanbanBoard({ initialData, searchQuery }: KanbanBoardProps) {
  const t = useTranslations("leads")
  const [data, setData] = useState<LeadsByStage>(initialData)
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null)
  const [, setDraggedLeadId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogStage, setAddDialogStage] = useState<LeadStage>("lead")
  const [, startTransition] = useTransition()

  // ── Recherche ────────────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const result: LeadsByStage = { lead: [], contacted: [], proposal: [], signed: [] }
    for (const stage of LEAD_STAGES) {
      const source = q
        ? data[stage].filter(
            (l) =>
              l.company_name.toLowerCase().includes(q) ||
              l.contact_name.toLowerCase().includes(q) ||
              (l.email && l.email.toLowerCase().includes(q)) ||
              (l.sector && l.sector.toLowerCase().includes(q))
          )
        : data[stage]
      // Tri par score Brand DNA décroissant (US-028).
      result[stage] = sortByScore(source)
    }
    return result
  }, [data, searchQuery])

  // ── Drag & Drop ──────────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, leadId: string) => {
      setDraggedLeadId(leadId)
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", leadId)
    },
    []
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, stage: LeadStage) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDragOverStage(stage)
    },
    []
  )

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetStage: LeadStage) => {
      e.preventDefault()
      setDragOverStage(null)

      const leadId = e.dataTransfer.getData("text/plain")
      if (!leadId) return

      // Trouver le lead et sa colonne source
      let sourceLead: LeadData | null = null
      let sourceStage: LeadStage | null = null

      for (const stage of LEAD_STAGES) {
        const found = data[stage].find((l) => l.id === leadId)
        if (found) {
          sourceLead = found
          sourceStage = stage
          break
        }
      }

      if (!sourceLead || !sourceStage || sourceStage === targetStage) {
        setDraggedLeadId(null)
        return
      }

      // Optimistic update
      const updatedLead = { ...sourceLead, stage: targetStage }
      setData((prev) => ({
        ...prev,
        [sourceStage]: prev[sourceStage].filter((l) => l.id !== leadId),
        [targetStage]: [updatedLead, ...prev[targetStage]],
      }))

      // Mettre à jour le lead sélectionné si nécessaire
      if (selectedLead?.id === leadId) {
        setSelectedLead(updatedLead)
      }

      setDraggedLeadId(null)

      // Server update
      startTransition(async () => {
        const result = await updateLeadAction({
          id: leadId,
          stage: targetStage,
        })
        if (!result.success) {
          // Rollback en cas d'erreur
          setData((prev) => ({
            ...prev,
            [targetStage]: prev[targetStage].filter((l) => l.id !== leadId),
            [sourceStage]: [sourceLead!, ...prev[sourceStage]],
          }))
        }
      })
    },
    [data, selectedLead]
  )

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleLeadClick = useCallback((lead: LeadData) => {
    setSelectedLead(lead)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedLead(null)
  }, [])

  const handleAddLead = useCallback((stage: LeadStage) => {
    setAddDialogStage(stage)
    setAddDialogOpen(true)
  }, [])

  const handleLeadCreated = useCallback((lead: LeadData) => {
    setData((prev) => ({
      ...prev,
      [lead.stage]: [...prev[lead.stage], lead],
    }))
  }, [])

  const handleLeadEnriched = useCallback((updatedLead: LeadData) => {
    setData((prev) => ({
      ...prev,
      [updatedLead.stage]: prev[updatedLead.stage].map((l) =>
        l.id === updatedLead.id ? updatedLead : l
      ),
    }))
    setSelectedLead((prev) => (prev?.id === updatedLead.id ? updatedLead : prev))
  }, [])

  const handleEditLead = useCallback((_lead: LeadData) => {
    // Pour l'instant, juste un placeholder - le formulaire d'édition sera une prochaine itération
  }, [])

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Kanban board */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEAD_STAGES.map((stage) => {
            const config = STAGE_CONFIG[stage]
            const stageLeads = filteredData[stage]
            const total = getStageTotal(stageLeads)

            return (
              <div
                key={stage}
                className="flex flex-col"
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Header colonne */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold tracking-wider",
                        config.color
                      )}
                    >
                      {config.label}
                    </span>
                    <span
                      className="inline-flex items-center justify-center size-5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground"
                    >
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-foreground dark:text-white">
                    {formatMAD(total)}
                  </span>
                </div>

                {/* Zone droppable */}
                <div
                  className={cn(
                    "flex-1 space-y-3 min-h-[200px] rounded-xl p-2 transition-colors",
                    dragOverStage === stage &&
                      "bg-violet-500/5 ring-2 ring-violet-500/20 ring-dashed dark:bg-violet-500/10"
                  )}
                >
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={handleLeadClick}
                      onDragStart={handleDragStart}
                    />
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-border">
                      <p className="text-xs text-muted-foreground">
                        {t("noLeadInColumn")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bouton ajouter */}
                <button
                  onClick={() => handleAddLead(stage)}
                  className="mt-3 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-medium transition-colors border border-dashed border-border text-muted-foreground hover:border-violet-400/40 hover:text-violet-400"
                >
                  <Plus className="size-3.5" />
                  {t("addLead")}
                </button>
              </div>
            )
          })}
        </div>

        {/* Panel détail */}
        <div className="hidden xl:block">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground dark:text-white">
                {t("prospectDetail")}
              </h3>
            </div>
            {selectedLead ? (
              <LeadDetailPanel
                lead={selectedLead}
                onClose={handleCloseDetail}
                onEdit={handleEditLead}
                onEnriched={handleLeadEnriched}
                onScored={handleLeadEnriched}
              />
            ) : (
              <div
                className="glass-card rounded-2xl p-8 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  {t("selectLeadForDetails")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile detail panel (overlay) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseDetail}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm overflow-y-auto glass-card p-4">
            <LeadDetailPanel
              lead={selectedLead}
              onClose={handleCloseDetail}
              onEdit={handleEditLead}
              onEnriched={handleLeadEnriched}
            />
          </div>
        </div>
      )}

      {/* Dialog ajout lead */}
      <AddLeadDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onCreated={handleLeadCreated}
        defaultStage={addDialogStage}
      />
    </>
  )
}
