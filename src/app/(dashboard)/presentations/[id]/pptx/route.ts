// ============================================================
// Téléchargement PPTX d'une présentation (deck généré)
// ============================================================
// Génère un VRAI fichier .pptx (pptxgenjs, style cabinet de conseil) à partir
// du deck persisté. Tenant-scopé (RLS).

import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { presentationContentSchema } from "@/lib/schemas/presentation.schema"
import { buildDeckPptx } from "@/lib/services/documents/pptx/deck-pptx"

function safeFilename(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return `${base || "presentation"}.pptx`
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return new Response("Non authentifié.", { status: 401 })

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return new Response("Tenant introuvable.", { status: 403 })

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("title, type, content_json")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("type", "presentation")
    .single()

  if (docError || !doc) return new Response("Présentation introuvable.", { status: 404 })

  const parsed = presentationContentSchema.safeParse(doc.content_json)
  if (!parsed.success) return new Response("Contenu de la présentation indisponible.", { status: 422 })

  try {
    const buffer = await buildDeckPptx(parsed.data, doc.title as string)
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeFilename(doc.title as string)}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return new Response("Erreur lors de la génération du PPTX.", { status: 500 })
  }
}
