# Multi-stage Dockerfile for Fastify API
FROM node:18-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@9.15.3

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
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the fastify API application
RUN npx nx build fastify-api --prod

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy the built application
COPY --from=builder /app/dist/apps/fastify-api ./
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN npm install --omit=dev

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

# Change ownership of the app directory
RUN chown -R fastify:nodejs /app
USER fastify

# Expose the API port
EXPOSE 3334

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3334/health || exit 1

# Start the application
CMD ["node", "main.js"]
