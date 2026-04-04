# Carrier Management System — Docker Build
# Run from the monorepo root: docker build -f apps/carrier-management/Dockerfile .

FROM node:20-alpine AS base

# ─── Install dependencies ────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY apps/carrier-management/package.json ./apps/carrier-management/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/freight-core/package.json ./packages/freight-core/

RUN npm ci

# ─── Build ───────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/carrier-management/node_modules ./apps/carrier-management/node_modules
COPY . .

# Build the app
WORKDIR /app/apps/carrier-management
RUN npm run db:migrate
RUN npm run build

# ─── Production ──────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/carrier-management/.next ./.next
COPY --from=builder /app/apps/carrier-management/public ./public
COPY --from=builder /app/apps/carrier-management/package.json ./package.json
COPY --from=builder /app/apps/carrier-management/node_modules ./node_modules
COPY --from=builder /app/apps/carrier-management/src/db ./src/db

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3001

CMD ["npm", "start"]
