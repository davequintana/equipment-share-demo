# Multi-stage Dockerfile for React SSR Web App
FROM node:24-alpine AS base

# Install system dependencies for native builds (only needed for build stage)
RUN apk add --no-cache g++ libc6-compat make python3

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

# Copy source code
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Set environment variables for Docker build
ENV NX_DAEMON=false
ENV CI=true
ENV NODE_ENV=production

# Build the web application for SSR and static assets
RUN npx nx build web-app --prod && \
    echo "Build completed, verifying output structure:" && \
    echo "Contents of dist/apps/web-app:" && \
    ls -la dist/apps/web-app/ && \
    echo "Checking for SSR server files:" && \
    find dist/apps/web-app -name "*.js" -type f | head -10

# Production stage - serve static files with nginx
FROM nginx:alpine AS runner

# Install basic tools for health checks
RUN apk add --no-cache wget

# Copy built application to nginx html directory
COPY --from=builder /app/dist/apps/web-app /usr/share/nginx/html

# Copy nginx configuration
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 4200;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html 404.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://host.docker.internal:3334;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF

EXPOSE 4200

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4200/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
