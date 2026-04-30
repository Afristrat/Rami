"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, Check, ChevronDown, Zap, Brain, Globe, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export type PromptProvider =
  // ── Texte / LLM ──────────────────────────────────────────────────────────────
  | "anthropic" | "openai" | "openrouter" | "perplexity" | "moonshot" | "mistral"
  // ── Image ────────────────────────────────────────────────────────────────────
  | "fal_ai" | "replicate" | "together_ai"
  // ── Vidéo ────────────────────────────────────────────────────────────────────
  | "veo" | "sora" | "runway" | "kling" | "luma_ray" | "wan" | "ltx_video" | "minimax_video" | "hailuo"
  // ── Audio / Voix ─────────────────────────────────────────────────────────────
  | "elevenlabs" | "cartesia"

type ModelTag = "fast" | "balanced" | "powerful" | "search" | "open" | "free" | "image" | "video" | "audio"

type ModelEntry = {
  id: string
  name: string
  description: string
  tag?: ModelTag
}

const MODELS: Record<PromptProvider, ModelEntry[]> = {
  // ── Anthropic ───────────────────────────────────────────────────────────────
  anthropic: [
    {
      id: "claude-haiku-4-5-20251001",
      name: "Claude Haiku 4.5",
      description: "Ultra-rapide · économique · tâches répétitives et structured output",
      tag: "fast",
    },
    {
      id: "claude-sonnet-4-6",
      name: "Claude Sonnet 4.6",
      description: "Recommandé production · équilibre vitesse / qualité / coût",
      tag: "balanced",
    },
    {
      id: "claude-opus-4-6",
      name: "Claude Opus 4.6",
      description: "Le plus puissant Claude · raisonnement complexe · Brand DNA avancé",
      tag: "powerful",
    },
  ],

  // ── OpenAI ──────────────────────────────────────────────────────────────────
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Multimodal · top performance · vision + texte",
      tag: "powerful",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Rapide et économique · excellent rapport qualité/prix",
      tag: "fast",
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "Contexte 128k · tâches longues et complexes",
      tag: "balanced",
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Ultra-rapide · très économique · tâches simples",
      tag: "fast",
    },
  ],

  // ── OpenRouter ──────────────────────────────────────────────────────────────
  openrouter: [
    {
      id: "auto",
      name: "Auto",
      description: "Sélection automatique du meilleur modèle disponible",
      tag: "balanced",
    },

    // ── 🇨🇳 S-Tier — Classement Chatbot Arena Mars 2026 ──────────────────────
    {
      id: "z-ai/glm-5",
      name: "GLM-5 ★ #1 Arena",
      description: "🥇 Arena 1455 · SWE-bench 77.8 · meilleur code tous modèles · Z.ai (Zhipu)",
      tag: "powerful",
    },
    {
      id: "z-ai/glm-4.7",
      name: "GLM-4.7",
      description: "HumanEval 94.2 · AIME 95.7 · #6 LMArena Code · spécialiste code · Z.ai",
      tag: "powerful",
    },
    {
      id: "z-ai/glm-4.5",
      name: "GLM-4.5 (MoE Agents)",
      description: "Architecture MoE · optimisé agents · Z.ai",
      tag: "balanced",
    },
    {
      id: "z-ai/glm-4.5-air:free",
      name: "GLM-4.5 Air ✦ GRATUIT",
      description: "131K contexte · gratuit · Z.ai — parfait pour tests",
      tag: "free",
    },
    {
      id: "moonshotai/kimi-k2.5",
      name: "Kimi K2.5 (1T MoE) ★ #3",
      description: "🥉 Arena 1452 · HumanEval 99.0 · MATH-500 98.0 · champion raisonnement · Moonshot AI",
      tag: "powerful",
    },
    {
      id: "qwen/qwen3-235b-a22b",
      name: "Qwen3 235B (MoE) ★ #2",
      description: "🥈 Arena 1454 · GPQA Diamond 88.4 · IFEval 92.6 · multilingue FR/AR · Alibaba",
      tag: "powerful",
    },
    {
      id: "minimax/minimax-m2.5",
      name: "MiniMax M2.5",
      description: "#1 usage OpenRouter mars 2026 · montée fulgurante · MiniMax",
      tag: "powerful",
    },
    {
      id: "deepseek/deepseek-v3.2",
      name: "DeepSeek-V3.2",
      description: "Top 5 usage OpenRouter · SWE-bench 67.8 · ~$0.27/M tokens · DeepSeek",
      tag: "powerful",
    },
    {
      id: "deepseek/deepseek-r1-0528",
      name: "DeepSeek-R1-0528",
      description: "Raisonnement mathématique · FrontierMath #4 · ~$0.55/M tokens · DeepSeek",
      tag: "powerful",
    },

    // ── 🆓 Modèles gratuits notables ─────────────────────────────────────────
    {
      id: "qwen/qwen3-coder-480b:free",
      name: "Qwen3 Coder 480B ✦ GRATUIT",
      description: "262K contexte · code spécialisé · Alibaba — meilleur code gratuit",
      tag: "free",
    },
    {
      id: "deepseek/deepseek-r1-0528:free",
      name: "DeepSeek-R1-0528 ✦ GRATUIT",
      description: "128K contexte · raisonnement · DeepSeek — gratuit avec limite",
      tag: "free",
    },
    {
      id: "qwen/qwen3-vl-235b-thinking:free",
      name: "Qwen3 VL 235B Vision ✦ GRATUIT",
      description: "128K · vision + raisonnement · multimodal · Alibaba",
      tag: "free",
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct:free",
      name: "Llama 3.3 70B ✦ GRATUIT",
      description: "128K · généraliste · excellent français · Meta",
      tag: "free",
    },
    {
      id: "mistralai/mistral-small-3.1-24b-instruct:free",
      name: "Mistral Small 3.1 24B ✦ GRATUIT",
      description: "128K · rapide · multilingue · Mistral AI",
      tag: "free",
    },
    {
      id: "arcee-ai/trinity-large-preview:free",
      name: "Trinity Large ✦ GRATUIT",
      description: "131K · reasoning agent · Arcee AI",
      tag: "free",
    },
    {
      id: "google/gemma-3-27b-it:free",
      name: "Gemma 3 27B Vision ✦ GRATUIT",
      description: "131K · vision + texte · Google — scoring Brand DNA visuel",
      tag: "free",
    },

    // ── 🔭 Google Gemini ──────────────────────────────────────────────────────
    {
      id: "google/gemini-3-flash-preview",
      name: "Gemini 3 Flash Preview",
      description: "Dernière génération Google · ultra-rapide · multimodal",
      tag: "fast",
    },
    {
      id: "google/gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      description: "Contexte très long · raisonnement · multimodal · Google",
      tag: "powerful",
    },
    {
      id: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      description: "Rapide · efficace · 1M tokens · multimodal · Google",
      tag: "fast",
    },

    // ── 🐦 xAI Grok ──────────────────────────────────────────────────────────
    {
      id: "x-ai/grok-4",
      name: "Grok 4",
      description: "Dernière génération xAI · accès données X/Twitter temps réel",
      tag: "powerful",
    },
    {
      id: "x-ai/grok-4-fast",
      name: "Grok 4 Fast",
      description: "Version rapide de Grok 4 · réponses quasi-instantanées · xAI",
      tag: "fast",
    },

    // ── 🇫🇷 Modèles européens ──────────────────────────────────────────────────
    {
      id: "mistralai/mistral-large",
      name: "Mistral Large",
      description: "Meilleur modèle français propriétaire · Mistral AI",
      tag: "powerful",
    },
    {
      id: "meta-llama/llama-3.1-70b-instruct",
      name: "Llama 3.1 70B",
      description: "Open-source solide · excellent français · Meta",
      tag: "open",
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o (via OpenRouter)",
      description: "GPT-4o accessible sans clé OpenAI directe",
      tag: "powerful",
    },
  ],

  // ── Moonshot AI (Kimi) ───────────────────────────────────────────────────────
  moonshot: [
    {
      id: "kimi-k2.5",
      name: "Kimi K2.5",
      description: "Flagship 2026 · 1T MoE · 256k contexte · vision + tool use · meilleur benchmark code et raisonnement",
      tag: "powerful" as ModelTag,
    },
    {
      id: "kimi-k2-thinking",
      name: "Kimi K2 Thinking",
      description: "Raisonnement étendu (chain-of-thought interne) · tâches analytiques complexes",
      tag: "powerful" as ModelTag,
    },
    {
      id: "kimi-k2-thinking-turbo",
      name: "Kimi K2 Thinking Turbo",
      description: "Thinking optimisé vitesse · raisonnement rapide · bon rapport qualité/coût",
      tag: "balanced" as ModelTag,
    },
    {
      id: "kimi-k2-turbo-preview",
      name: "Kimi K2 Turbo Preview",
      description: "Version turbo de K2 · preview · latence réduite · génération de contenu",
      tag: "fast" as ModelTag,
    },
    {
      id: "kimi-k2-0905-preview",
      name: "Kimi K2 0905 Preview",
      description: "Preview sept. 2025 · dernière itération K2 · améliorations code et raisonnement",
      tag: "balanced" as ModelTag,
    },
    {
      id: "kimi-k2-0711-preview",
      name: "Kimi K2 0711 Preview",
      description: "Preview juil. 2025 · K2 stable · bon rapport qualité/prix",
      tag: "balanced" as ModelTag,
    },
    {
      id: "moonshot-v1-128k",
      name: "Moonshot v1 128k",
      description: "Stable · 128k contexte · Brand DNA complet",
      tag: "balanced" as ModelTag,
    },
    {
      id: "moonshot-v1-32k",
      name: "Moonshot v1 32k",
      description: "Stable · 32k contexte · génération standard",
      tag: "fast" as ModelTag,
    },
    {
      id: "moonshot-v1-8k",
      name: "Moonshot v1 8k",
      description: "Ultra-rapide · 8k · structured output et tâches courtes",
      tag: "fast" as ModelTag,
    },
    {
      id: "moonshot-v1-auto",
      name: "Moonshot v1 Auto",
      description: "Sélection automatique du contexte optimal (8k/32k/128k)",
      tag: "fast" as ModelTag,
    },
    {
      id: "moonshot-v1-128k-vision-preview",
      name: "Moonshot v1 128k Vision",
      description: "Vision multimodale · 128k contexte · analyse logo et visuels",
      tag: "powerful" as ModelTag,
    },
    {
      id: "moonshot-v1-32k-vision-preview",
      name: "Moonshot v1 32k Vision",
      description: "Vision multimodale · 32k contexte · scoring Brand DNA visuel",
      tag: "balanced" as ModelTag,
    },
    {
      id: "moonshot-v1-8k-vision-preview",
      name: "Moonshot v1 8k Vision",
      description: "Vision rapide · 8k contexte · validation visuelle courte",
      tag: "fast" as ModelTag,
    },
  ],

  // ── Mistral AI ──────────────────────────────────────────────────────────────
  mistral: [
    {
      id: "mistral-small-latest",
      name: "Mistral Small",
      description: "Rapide et économique · multilingue · tâches répétitives",
      tag: "fast" as ModelTag,
    },
    {
      id: "mistral-medium-latest",
      name: "Mistral Medium",
      description: "Équilibre vitesse/qualité · excellent français · recommandé",
      tag: "balanced" as ModelTag,
    },
    {
      id: "mistral-large-latest",
      name: "Mistral Large",
      description: "Meilleur modèle Mistral · raisonnement avancé · brand DNA",
      tag: "powerful" as ModelTag,
    },
  ],

  // ── Perplexity ──────────────────────────────────────────────────────────────
  perplexity: [
    {
      id: "sonar",
      name: "Sonar",
      description: "Recherche web en temps réel · standard · recommandé pour benchmarks",
      tag: "search",
    },
    {
      id: "sonar-pro",
      name: "Sonar Pro",
      description: "Recherche web approfondie · citations multiples · premium",
      tag: "search",
    },
    {
      id: "sonar-reasoning",
      name: "Sonar Reasoning",
      description: "Chain-of-Thought + recherche web · tâches d'analyse complexes",
      tag: "powerful",
    },
  ],

  // ── Fal.ai ──────────────────────────────────────────────────────────────────
  fal_ai: [
    {
      id: "fal-ai/flux/pro",
      name: "FLUX.1 [pro]",
      description: "Meilleure qualité Fal.ai · recommandé production · ~$0.05/image",
      tag: "image" as ModelTag,
    },
    {
      id: "fal-ai/flux/dev",
      name: "FLUX.1 [dev]",
      description: "Qualité élevée · open-weights · ~$0.025/image",
      tag: "image" as ModelTag,
    },
    {
      id: "fal-ai/ideogram/v2",
      name: "Ideogram v2",
      description: "Excellent pour texte dans les images · logos · typographie",
      tag: "image" as ModelTag,
    },
    {
      id: "fal-ai/ideogram/v2/turbo",
      name: "Ideogram v2 Turbo",
      description: "Version rapide d'Ideogram v2 · texte + vitesse",
      tag: "image" as ModelTag,
    },
    {
      id: "fal-ai/stable-diffusion-v3-medium",
      name: "Stable Diffusion 3 Medium",
      description: "SD3 medium · bon rapport qualité/coût · versatile",
      tag: "image" as ModelTag,
    },
    {
      id: "fal-ai/flux-lora",
      name: "FLUX LoRA",
      description: "FLUX avec LoRA fine-tuning · styles personnalisés",
      tag: "image" as ModelTag,
    },
  ],

  // ── Replicate ────────────────────────────────────────────────────────────────
  replicate: [
    {
      id: "black-forest-labs/flux-dev",
      name: "FLUX.1 [dev]",
      description: "Fallback image gen · open-weights · ~$0.03/image",
      tag: "image" as ModelTag,
    },
    {
      id: "black-forest-labs/flux-schnell",
      name: "FLUX.1 [schnell]",
      description: "Ultra-rapide · économique · ~$0.003/image · tests et drafts",
      tag: "image" as ModelTag,
    },
    {
      id: "stability-ai/sdxl",
      name: "Stable Diffusion XL",
      description: "SDXL · très versatile · grande communauté LoRA",
      tag: "image" as ModelTag,
    },
    {
      id: "stability-ai/stable-diffusion-3",
      name: "Stable Diffusion 3",
      description: "SD3 · qualité premium · flux de composition avancé",
      tag: "image" as ModelTag,
    },
  ],

  // ── Together AI ──────────────────────────────────────────────────────────────
  together_ai: [
    {
      id: "black-forest-labs/FLUX.1-schnell-Free",
      name: "FLUX.1 Schnell (Gratuit)",
      description: "Fallback économique · gratuit · idéal pour tests Brand DNA",
      tag: "image" as ModelTag,
    },
    {
      id: "black-forest-labs/FLUX.1-dev",
      name: "FLUX.1 [dev]",
      description: "Qualité intermédiaire · fallback 2 production",
      tag: "image" as ModelTag,
    },
    {
      id: "black-forest-labs/FLUX.1.1-pro",
      name: "FLUX.1.1 Pro",
      description: "Version Pro FLUX via Together · haute qualité",
      tag: "image" as ModelTag,
    },
    {
      id: "stabilityai/stable-diffusion-xl-base-1.0",
      name: "SDXL Base 1.0",
      description: "SDXL stable via Together AI · bon rapport qualité/prix",
      tag: "image" as ModelTag,
    },
  ],

  // ── Google Veo ───────────────────────────────────────────────────────────────
  veo: [
    {
      id: "veo-2",
      name: "Veo 2",
      description: "Génération vidéo Google · 1080p · mouvement fluide · jusqu'à 8s",
      tag: "video" as ModelTag,
    },
    {
      id: "veo-3",
      name: "Veo 3",
      description: "Dernière génération Google · avec audio intégré · cinématique",
      tag: "video" as ModelTag,
    },
  ],

  // ── OpenAI Sora ──────────────────────────────────────────────────────────────
  sora: [
    {
      id: "sora-1.0",
      name: "Sora 1.0",
      description: "Génération vidéo OpenAI · réalisme exceptionnel · jusqu'à 60s",
      tag: "video" as ModelTag,
    },
    {
      id: "sora-turbo",
      name: "Sora Turbo",
      description: "Version rapide de Sora · bon rapport qualité/vitesse",
      tag: "video" as ModelTag,
    },
  ],

  // ── Runway ───────────────────────────────────────────────────────────────────
  runway: [
    {
      id: "gen4-turbo",
      name: "Gen-4 Turbo",
      description: "Dernier modèle Runway · mouvement cinématique · cohérence visuelle",
      tag: "video" as ModelTag,
    },
    {
      id: "gen3a-turbo",
      name: "Gen-3 Alpha Turbo",
      description: "Gen-3 rapide · production courante · bon rapport qualité/coût",
      tag: "video" as ModelTag,
    },
  ],

  // ── Kling AI ─────────────────────────────────────────────────────────────────
  kling: [
    {
      id: "kling-v2",
      name: "Kling v2",
      description: "Dernière génération Kling · 1080p · 10s · mouvement réaliste",
      tag: "video" as ModelTag,
    },
    {
      id: "kling-v1.6-pro",
      name: "Kling v1.6 Pro",
      description: "Haute qualité · 5-10s · cohérence personnage · Kuaishou",
      tag: "video" as ModelTag,
    },
    {
      id: "kling-v1.6-standard",
      name: "Kling v1.6 Standard",
      description: "Version standard · rapide · économique · tests",
      tag: "video" as ModelTag,
    },
  ],

  // ── Luma Ray (Dream Machine) ─────────────────────────────────────────────────
  luma_ray: [
    {
      id: "ray-2",
      name: "Ray 2",
      description: "Dernière génération Luma AI · fluidité exceptionnelle · 5s",
      tag: "video" as ModelTag,
    },
    {
      id: "dream-machine-1.0",
      name: "Dream Machine 1.0",
      description: "Stable · production · mouvement naturel · Luma AI",
      tag: "video" as ModelTag,
    },
  ],

  // ── WAN Video ────────────────────────────────────────────────────────────────
  wan: [
    {
      id: "wan2.1-t2v-14b",
      name: "WAN 2.1 T2V 14B",
      description: "Text-to-video · 14B paramètres · open-source · Alibaba",
      tag: "video" as ModelTag,
    },
    {
      id: "wan2.1-i2v-14b",
      name: "WAN 2.1 I2V 14B",
      description: "Image-to-video · 14B · anime votre visuel RAMI en vidéo",
      tag: "video" as ModelTag,
    },
  ],

  // ── LTX Video ────────────────────────────────────────────────────────────────
  ltx_video: [
    {
      id: "ltx-video-0.9.7",
      name: "LTX Video 0.9.7",
      description: "Génération vidéo temps réel · open-source · LightRicks",
      tag: "video" as ModelTag,
    },
  ],

  // ── MiniMax Video ────────────────────────────────────────────────────────────
  minimax_video: [
    {
      id: "video-01",
      name: "Video-01",
      description: "Génération vidéo MiniMax · mouvements dynamiques · 6s",
      tag: "video" as ModelTag,
    },
    {
      id: "video-01-live",
      name: "Video-01 Live",
      description: "Optimisé streaming live · vitesse accrue · MiniMax",
      tag: "video" as ModelTag,
    },
  ],

  // ── Hailuo AI ────────────────────────────────────────────────────────────────
  hailuo: [
    {
      id: "hailuo-video-01",
      name: "Hailuo Video-01",
      description: "MiniMax Hailuo · 1080p · mouvement réaliste · 6s",
      tag: "video" as ModelTag,
    },
    {
      id: "hailuo-video-01-live",
      name: "Hailuo Video-01 Live",
      description: "Version live · économique · tests vidéo",
      tag: "video" as ModelTag,
    },
  ],

  // ── ElevenLabs ───────────────────────────────────────────────────────────────
  elevenlabs: [
    {
      id: "eleven_v3",
      name: "ElevenLabs v3",
      description: "Dernier modèle · prosodie ultra-réaliste · clonage voix · recommandé production",
      tag: "audio" as ModelTag,
    },
    {
      id: "eleven_multilingual_v2",
      name: "Multilingual v2",
      description: "Meilleur support multilingue · FR / AR / EN parfait pour MENA · voiceovers",
      tag: "audio" as ModelTag,
    },
    {
      id: "eleven_turbo_v2_5",
      name: "Turbo v2.5",
      description: "Faible latence · rapport qualité/vitesse · narrations courtes",
      tag: "audio" as ModelTag,
    },
    {
      id: "eleven_flash_v2_5",
      name: "Flash v2.5",
      description: "Ultra-rapide · économique · tâches répétitives · drafts",
      tag: "audio" as ModelTag,
    },
  ],

  // ── Cartesia ─────────────────────────────────────────────────────────────────
  cartesia: [
    {
      id: "sonic-3",
      name: "Sonic 3",
      description: "< 100ms latence · favoris Reddit pour agents vocaux · conversations fluides",
      tag: "audio" as ModelTag,
    },
    {
      id: "sonic-2",
      name: "Sonic 2",
      description: "Version stable · bon rapport qualité/coût · dialogues IA",
      tag: "audio" as ModelTag,
    },
  ],
}

const TAG_CONFIG: Record<ModelTag, { label: string; className: string }> = {
  fast:     { label: "Rapide",      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  balanced: { label: "Équilibré",   className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  powerful: { label: "Puissant",    className: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  search:   { label: "Recherche",   className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  open:     { label: "Open-source", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  free:     { label: "Gratuit",     className: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30" },
  image:    { label: "Image",       className: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  video:    { label: "Vidéo",       className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  audio:    { label: "Audio",       className: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
}

const PROVIDER_ICONS: Record<PromptProvider, React.ReactNode> = {
  // Texte
  anthropic:     <Cpu   className="size-3.5" />,
  openai:        <Brain className="size-3.5" />,
  openrouter:    <Globe className="size-3.5" />,
  perplexity:    <Zap   className="size-3.5" />,
  moonshot:      <Zap   className="size-3.5" />,
  mistral:       <Zap   className="size-3.5" />,
  // Image
  fal_ai:        <Zap   className="size-3.5 text-pink-400" />,
  replicate:     <Cpu   className="size-3.5 text-pink-400" />,
  together_ai:   <Globe className="size-3.5 text-pink-400" />,
  // Vidéo
  veo:           <Zap   className="size-3.5 text-orange-400" />,
  sora:          <Brain className="size-3.5 text-orange-400" />,
  runway:        <Zap   className="size-3.5 text-orange-400" />,
  kling:         <Cpu   className="size-3.5 text-orange-400" />,
  luma_ray:      <Zap   className="size-3.5 text-orange-400" />,
  wan:           <Globe className="size-3.5 text-orange-400" />,
  ltx_video:     <Cpu   className="size-3.5 text-orange-400" />,
  minimax_video: <Brain className="size-3.5 text-orange-400" />,
  hailuo:        <Zap   className="size-3.5 text-orange-400" />,
  // Audio
  elevenlabs:    <Zap   className="size-3.5 text-teal-400" />,
  cartesia:      <Cpu   className="size-3.5 text-teal-400" />,
}

type Props = {
  provider: PromptProvider
  value: string
  onChange: (model: string) => void
}

export function ModelPicker({ provider, value, onChange }: Props) {
  const t = useTranslations("admin")
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState("")
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState("")
  const panelRef                  = useRef<HTMLDivElement>(null)
  const searchRef                 = useRef<HTMLInputElement>(null)

  const models = MODELS[provider] ?? []

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return models
    return models.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    )
  }, [models, query])

  const selectedModel = models.find((m) => m.id === value)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setQuery("")
        setCustomMode(false)
        setCustomValue("")
      })
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  function selectModel(id: string) {
    onChange(id)
    setOpen(false)
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-mono text-left transition-colors",
          open
            ? "border-violet-500/50 ring-2 ring-violet-500/20"
            : "border-border hover:border-border/80"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground shrink-0">
            {PROVIDER_ICONS[provider]}
          </span>
          <span className="truncate text-foreground">
            {selectedModel?.name ?? value ?? t("chooseModel")}
          </span>
          {selectedModel?.tag && (
            <span className={cn(
              "hidden sm:inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
              TAG_CONFIG[selectedModel.tag].className
            )}>
              {TAG_CONFIG[selectedModel.tag].label}
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "size-3.5 shrink-0 text-muted-foreground transition-transform",
          open && "rotate-180"
        )} />
      </button>

      {value && (
        <p className="mt-1 text-[11px] font-mono text-muted-foreground/60 truncate px-0.5">
          {value}
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchModels", { count: models.length })}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                {t("noModelFound")} &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((model) => {
                const isSelected = model.id === value
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => selectModel(model.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors",
                      isSelected ? "bg-violet-500/10" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="mt-0.5 size-3.5 shrink-0">
                      {isSelected && <Check className="size-3.5 text-violet-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-violet-300" : "text-foreground"
                        )}>
                          {model.name}
                        </span>
                        {model.tag && (
                          <span className={cn(
                            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                            TAG_CONFIG[model.tag].className
                          )}>
                            {TAG_CONFIG[model.tag].label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {model.description}
                      </p>
                      <code className="text-[10px] text-muted-foreground/50 font-mono">
                        {model.id}
                      </code>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-3 py-2.5">
            {customMode ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={t("exactModelId")}
                  autoFocus
                  className="flex-1 rounded-lg border border-violet-500/40 bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customValue.trim()) {
                      onChange(customValue.trim())
                      setOpen(false)
                    }
                    if (e.key === "Escape") setCustomMode(false)
                  }}
                />
                <button
                  type="button"
                  disabled={!customValue.trim()}
                  onClick={() => {
                    if (customValue.trim()) {
                      onChange(customValue.trim())
                      setOpen(false)
                    }
                  }}
                  className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
                >
                  {t("confirm")}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                {t("modelNotListed")}{" "}
                <button
                  type="button"
                  onClick={() => { setCustomMode(true); setCustomValue(value) }}
                  className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
                >
                  {t("enterManually")}
                </button>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
