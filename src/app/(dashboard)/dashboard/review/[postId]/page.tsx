// ============================================================
// Page de validation humaine d'un post avant publication.
// Cible du lien `approvalUrl` renvoyé par l'API v1 (chemin Hermès) et point
// d'approbation interne. Charge le post (scopé tenant via RLS) et rend l'aperçu
// fidèle de chaque plateforme + le bouton d'approbation.
// ============================================================

import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { ReviewClient } from "@/components/preview/review-client"
import type { Platform } from "@/lib/scheduler/platform-config"

export const dynamic = "force-dynamic"

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) notFound()

  const { data: post } = await supabase
    .from("posts")
    .select("id, content, platforms, media_urls, approved_at, title")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single<{
      id: string
      content: string
      platforms: string[] | null
      media_urls: string[] | null
      approved_at: string | null
      title: string | null
    }>()
  if (!post) notFound()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", tenantId)
    .single<{ name: string }>()

  return (
    <ReviewClient
      postId={post.id}
      content={post.content}
      platforms={(post.platforms ?? []) as Platform[]}
      mediaUrls={post.media_urls ?? []}
      accountName={tenant?.name ?? "Votre marque"}
      isApproved={post.approved_at !== null}
    />
  )
}
