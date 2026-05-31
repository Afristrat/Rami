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

  // 3. Call Vision (proxy OpenAI-compatible)
  const apiKey = process.env.OPENAI_API_KEY
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

  // Normaliser en data URL (le proxy Vision OpenAI-compatible accepte
  // une URL data:<mime>;base64,... directement dans image_url.url)
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, "")
  const imageDataUrl = `data:${fileType};base64,${base64Data}`

  const visionModel = process.env.VISION_MODEL || "moonshot-v1-8k-vision-preview"

  try {
    const response = await fetch(
      `${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: visionModel,
          max_tokens: 1024,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this brand document and extract the brand identity information as specified.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageDataUrl },
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      log({
        level: "error",
        module: "extract-guidelines",
        action: "vision_api_error",
        metadata: { status: response.status, body: errorBody },
      })
      return NextResponse.json(
        { error: "AI analysis failed" },
        { status: 502 }
      )
    }

    const result = await response.json()
    const textContent =
      (result.choices?.[0]?.message?.content as string | undefined) ?? ""

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
