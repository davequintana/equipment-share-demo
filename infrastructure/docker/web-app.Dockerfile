# Multi-stage Dockerfile for React SSR Web App
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

# Build both client and server
RUN npx nx build web-app --prod
RUN npx nx build-server web-app --prod

# Production stage with Node.js
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy the built application (both client and server builds)
COPY --from=builder /app/dist/apps/web-app ./dist
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN npm install --omit=dev

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 webapp

# Change ownership of the app directory
RUN chown -R webapp:nodejs /app
USER webapp

# Expose the web app port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the SSR application
CMD ["node", "dist/main.js"]
