import { redirect } from "next/navigation"

/**
 * Redirection silencieuse : /admin → /admin/prompts
 */
export default function AdminIndexPage() {
  redirect("/admin/prompts")
}
