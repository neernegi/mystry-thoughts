# Multi-stage build for Next.js 15 with TypeScript and Socket.io
FROM node:20-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application (this creates .next directory)
RUN npm run build

# Stage 3: Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV SOCKET_PORT=3001

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/node_modules ./node_modules

# Copy both possible Next.js outputs (standalone or server)
# Try to copy standalone, if not present, fallback to server
# Use shell to handle optional directories
RUN if [ -d .next/standalone ]; then \
      cp -r .next/standalone/* . ; \
    elif [ -d .next/server ]; then \
      mkdir -p .next/server && cp -r .next/server .next/ ; \
    fi

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000 3001

CMD ["npm", "start"]