import type { Metadata } from "next"
import { WorkflowClient } from "@/components/workflow/WorkflowClient"

export const metadata: Metadata = {
  title: "Créer du contenu — RAMI",
  description: "Workflow 7 étapes pour créer du contenu social media psychologiquement ciblé.",
}

export default function CreatePage() {
  return <WorkflowClient />
}
