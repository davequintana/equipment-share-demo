# Multi-stage Dockerfile for React Web App
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

# Build the web application
RUN npx nx build web-app --prod

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy built application to nginx html directory
COPY --from=builder /app/dist/apps/web-app /usr/share/nginx/html

# Copy custom nginx configuration
COPY infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security
RUN addgroup --system --gid 1001 nginx-app
RUN adduser --system --uid 1001 nginx-user --ingroup nginx-app

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx
RUN chown -R nginx-user:nginx-app /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Switch to non-root user
USER nginx-user

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
