# syntax=docker/dockerfile:1
# ============================================================
# RAMI — Image de production pour Coolify (serveur Ubuntu self-hosted)
# Build standalone Next.js 16 → image minimale Node 20 Alpine.
# Exposé au public via cloudflared tunnel (HTTPS terminé par Cloudflare).
# ============================================================

FROM node:20-alpine AS base
# libc6-compat : requis par sharp (traitement d'images) sur Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ─── Dépendances ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ─── Build ──────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Les variables NEXT_PUBLIC_* sont inlinées au build → doivent être présentes ici.
# Coolify : les déclarer en "Build Variable" (cocher "Available at buildtime").
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG MINIO_PUBLIC_URL
ARG MINIO_ENDPOINT
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ─── Runtime ────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Output "standalone" : serveur Node autonome + assets statiques
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Healthcheck Coolify → route /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
