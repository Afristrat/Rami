import { redirect } from "next/navigation"

/**
 * /admin/providers est fusionné dans /admin/keys
 */
export default function AdminProvidersPage() {
  redirect("/admin/keys")
}
