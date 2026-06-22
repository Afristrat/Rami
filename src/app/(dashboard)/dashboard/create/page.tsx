import { getTranslations } from "next-intl/server"
import { WorkflowClient } from "@/components/workflow/WorkflowClient"
import { getDraftWorkflowStateAction } from "@/lib/actions/workflow.actions"
import type { WorkflowState } from "@/lib/schemas/workflow.schema"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("create"),
    description: t("createDescription"),
  }
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>
}) {
  const { post } = await searchParams

  // Option B : rouvrir un post/brouillon existant directement dans le parcours
  // complet (édition/validation/publication), depuis le dashboard, l'historique
  // ou les approbations. État rechargé tenant-scopé (snapshot riche ou fallback).
  let initialState: WorkflowState | null = null
  let initialPostId: string | null = null
  if (post) {
    const res = await getDraftWorkflowStateAction(post)
    if (res) {
      initialState = res.state
      initialPostId = post
    }
  }

  return <WorkflowClient initialState={initialState} initialPostId={initialPostId} />
}
