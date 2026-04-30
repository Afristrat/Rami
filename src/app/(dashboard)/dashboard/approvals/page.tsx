import { getTranslations } from "next-intl/server"
import { ApprovalBoard } from "@/components/approvals/approval-board"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("approvals"),
    description: t("approvalsDescription"),
  }
}

export default function ApprovalsPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <ApprovalBoard />
    </div>
  )
}
