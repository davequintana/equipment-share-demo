# Multi-stage Dockerfile for Fastify API
FROM node:24-alpine AS base

# Install system dependencies and pnpm
RUN apk add --no-cache g++ libc6-compat make python3 && \
    npm install -g pnpm@9.15.3

# Set working directory
WORKDIR /app

# Copy package manager files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

# Copy source code
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Set environment variables for Docker build
ENV NX_DAEMON=false
ENV CI=true
ENV NODE_ENV=production

# Build the fastify API application
RUN npx nx build fastify-api --prod && \
    echo "Build completed, verifying API output:" && \
    ls -la dist/apps/fastify-api/

# Production stage - lightweight runtime
FROM node:24-alpine AS runner

# Install runtime dependencies and security updates
RUN apk add --no-cache dumb-init tini wget && \
    apk upgrade --no-cache

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3334
ENV HOST=0.0.0.0
ENV JWT_SECRET=docker-test-secret-change-in-production

# Copy the built application
COPY --from=builder /app/dist/apps/fastify-api ./
COPY --from=builder /app/package.json ./package.json

# Install production dependencies, create user, and set permissions
RUN npm install --omit=dev --production && \
    npm cache clean --force && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify && \
    chown -R fastify:nodejs /app

USER fastify

# Expose the API port
EXPOSE 3334

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3334/health || exit 1

# Use dumb-init for proper signal handling and start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "main.js"]
