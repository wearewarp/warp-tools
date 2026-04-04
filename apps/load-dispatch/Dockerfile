# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace manifests for Turborepo
COPY package.json package-lock.json* turbo.json ./
COPY apps/load-dispatch/package.json ./apps/load-dispatch/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/freight-core/package.json ./packages/freight-core/

RUN npm ci

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/load-dispatch/node_modules ./apps/load-dispatch/node_modules

COPY . .

# Run migrations before build so DB is available for any static checks
WORKDIR /app/apps/load-dispatch
RUN npx tsx src/db/migrate.ts || true

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo build --filter=@warp-tools/load-dispatch

# ─── Stage 3: Runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3005

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built output
COPY --from=builder /app/apps/load-dispatch/.next/standalone ./
COPY --from=builder /app/apps/load-dispatch/.next/static ./apps/load-dispatch/.next/static
COPY --from=builder /app/apps/load-dispatch/public ./apps/load-dispatch/public 2>/dev/null || true

# Copy drizzle migrations so they can be run at startup
COPY --from=builder /app/apps/load-dispatch/src/db ./apps/load-dispatch/src/db
COPY --from=builder /app/apps/load-dispatch/drizzle.config.ts ./apps/load-dispatch/drizzle.config.ts

# DB directory — persist the SQLite file here
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3005

CMD ["node", "apps/load-dispatch/server.js"]
