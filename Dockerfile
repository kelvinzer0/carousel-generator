# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ pixman-dev cairo-dev pango-dev giflib-dev jpeg-dev
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
ENV CANVAS_MODULE_PATH=/app/node_modules/.pnpm/canvas@2.11.2_encoding@0.1.13/node_modules/canvas/build/Release/canvas.node
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ pixman-dev cairo-dev pango-dev giflib-dev jpeg-dev
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
