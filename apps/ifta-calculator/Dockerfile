# IFTA Calculator — Docker Build
# Stateless tool — no database required
# Run from the monorepo root: docker build -f apps/ifta-calculator/Dockerfile .

FROM node:20-alpine AS base

# ─── Install dependencies ────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/ifta-calculator/package.json ./apps/ifta-calculator/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/freight-core/package.json ./packages/freight-core/

RUN npm ci

# ─── Build ───────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/ifta-calculator
RUN npm run build

# ─── Production ──────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3010

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/ifta-calculator/.next/standalone ./
COPY --from=builder /app/apps/ifta-calculator/.next/static ./.next/static
COPY --from=builder /app/apps/ifta-calculator/public ./public

USER nextjs

EXPOSE 3010

CMD ["node", "server.js"]
