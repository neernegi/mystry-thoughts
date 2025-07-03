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

# Build the application with standalone output
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

# First check if standalone output exists
RUN mkdir -p .next/standalone

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./

# Handle both standalone and server output modes
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/server ./.next/server

# Copy server files
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/node_modules ./node_modules

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000 3001


# Install PM2 globally
RUN npm install -g pm2

# Copy PM2 ecosystem file
COPY --from=builder /app/ecosystem.config.js ./

CMD ["pm2-runtime", "ecosystem.config.js"]