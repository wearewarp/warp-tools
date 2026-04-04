# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy workspace root files for monorepo resolution
COPY package.json turbo.json ./
COPY apps/dock-scheduler/package.json ./apps/dock-scheduler/
COPY packages/ ./packages/

RUN npm install --workspace=apps/dock-scheduler --include-workspace-root

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/dock-scheduler/node_modules ./apps/dock-scheduler/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL=file:./dock-scheduler.db

RUN npm run build --workspace=apps/dock-scheduler

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3006
ENV DATABASE_URL=file:./dock-scheduler.db

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built output
COPY --from=builder /app/apps/dock-scheduler/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/dock-scheduler/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dock-scheduler/.next/static ./.next/static

# Copy migration files so we can run db:migrate at startup
COPY --from=builder /app/apps/dock-scheduler/drizzle ./drizzle
COPY --from=builder /app/apps/dock-scheduler/drizzle.config.ts ./drizzle.config.ts

# Create data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3006

CMD ["node", "server.js"]
