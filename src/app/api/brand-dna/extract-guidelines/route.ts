import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { log } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Parse body — expects { dataUrl: string, fileType: string }
  const body = await request.json()
  const { dataUrl, fileType } = body as {
    dataUrl?: string
    fileType?: string
  }

  if (!dataUrl || typeof dataUrl !== "string") {
    return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 })
  }

  if (!fileType || typeof fileType !== "string") {
    return NextResponse.json({ error: "Missing fileType" }, { status: 400 })
  }

  // Validate MIME type — SVG is NOT supported by Claude Vision
  if (fileType === "image/svg+xml") {
    return NextResponse.json(
      { error: "SVG files are not supported for AI analysis. Please upload PNG, JPG or WebP." },
      { status: 400 }
    )
  }

  const SUPPORTED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
  ]
  const allowedTypes = [...SUPPORTED_IMAGE_TYPES, "application/pdf"]
  if (!allowedTypes.includes(fileType)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    )
  }

  // 3. Call Claude Haiku Vision
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    )
  }

  const systemPrompt = `You are a brand identity analyst. Analyze this brand document/image and extract structured brand information.
Return a JSON object with these fields (all optional, only include what you can confidently identify):
{
  "colors": ["#HEX1", "#HEX2", ...],
  "tagline": "...",
  "positioning": "...",
  "sector": "...",
  "toneIndicators": ["professional", "warm", ...],
  "fontFamilies": ["Font Name", ...],
  "brandName": "..."
}
Return ONLY the JSON, no markdown fences, no explanation.`

  // Extract base64 data (strip the data URL prefix if present)
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, "")

  // Determine the media type for the API call
  const mediaType = fileType.startsWith("image/")
    ? (fileType as
        | "image/png"
        | "image/jpeg"
        | "image/gif"
        | "image/webp")
    : "image/png"

  // For PDFs, we use the document type
  const contentBlock =
    fileType === "application/pdf"
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64Data,
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mediaType,
            data: base64Data,
          },
        }

  try {
    const response = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              contentBlock,
              {
                type: "text",
                text: "Analyze this brand document and extract the brand identity information as specified.",
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      log({
        level: "error",
        module: "extract-guidelines",
        action: "anthropic_api_error",
        metadata: { status: response.status, body: errorBody },
      })
      return NextResponse.json(
        { error: "AI analysis failed" },
        { status: 502 }
      )
    }

    const result = await response.json()
    const textContent =
      (result.content?.[0]?.text as string | undefined) ?? ""

    // Try to parse, handling potential markdown fences
    let cleanJson = textContent.trim()
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "")
    }

    try {
      const extracted = JSON.parse(cleanJson) as Record<string, unknown>
      return NextResponse.json({ success: true, extracted })
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: textContent },
        { status: 500 }
      )
    }
  } catch (err) {
    log({
      level: "error",
      module: "extract-guidelines",
      action: "fetch_error",
      metadata: { error: err instanceof Error ? err.message : String(err) },
    })
    return NextResponse.json(
      { error: "Failed to connect to AI service" },
      { status: 502 }
    )
  }
}
