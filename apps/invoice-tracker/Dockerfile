# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Set env for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the app
RUN npm run build

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3003

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create data directory for SQLite
RUN mkdir -p /data && chown nextjs:nodejs /data
ENV DATABASE_URL=file:/data/invoice-tracker.db

USER nextjs

EXPOSE 3003

CMD ["node", "server.js"]
