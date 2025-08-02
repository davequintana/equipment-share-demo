# Frontend Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Build the source code
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the web app
RUN npx nx build web-app --prod

# Production image
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy built app
COPY --from=builder /app/dist/apps/web-app .

# Copy nginx configuration
COPY apps/web-app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
