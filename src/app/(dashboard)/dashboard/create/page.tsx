import { getTranslations } from "next-intl/server"
import { WorkflowClient } from "@/components/workflow/WorkflowClient"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("create"),
    description: t("createDescription"),
  }
}

export default function CreatePage() {
  return <WorkflowClient />
}
