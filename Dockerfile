# Stage 1: Install dependencies
FROM node:20-bookworm-slim AS deps
RUN apt-get update && apt-get install -y python3 make g++ libpixman-1-dev libcairo2-dev libpango1.0-dev libgif-dev libjpeg-dev && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile --prod=false

# Stage 2: Build
FROM node:20-bookworm-slim AS builder
RUN apt-get update && apt-get install -y python3 make g++ libpixman-1-dev libcairo2-dev libpango1.0-dev libgif-dev libjpeg-dev && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
