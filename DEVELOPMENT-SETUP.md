# Development Environment Setup Guide

## Prerequisites

- **Node.js**: 23.6.0+ (Current LTS)
- **pnpm**: 9.0.0+
- **Docker**: Latest version with Docker Compose
- **Git**: For version control

## Quick Start

### 1. Environment Variables

```bash

# Generate secure environment variables

./scripts/setup-env.sh

# Or copy from template

cp .env.example .env

# Edit .env with your values

```

### 2. Install Dependencies

```bash

# Install all dependencies using pnpm

pnpm install
```

### 3. Development with Kafka (Recommended)

```bash

# Start all services including Kafka for behavior tracking

pnpm run dev:kafka

# This will:


# 1. Start PostgreSQL, Redis, and Kafka via Docker


# 2. Set up Kafka topics


# 3. Start development servers (web-app + fastify-api)

```

### 4. Alternative: Minimal Development Setup

```bash

# Start only databases (without Kafka)

docker-compose up -d postgres redis

# Start frontend and backend separately

pnpm run serve:web-app      # SSR React app at localhost:4200
pnpm run serve:fastify-api  # API at localhost:3334

# Or start both together

pnpm run dev
```

### 5. Optional Development Tools

```bash

# Start PgAdmin for database management

docker-compose --profile tools up -d pgadmin

# Start Kafka UI for monitoring (if not using dev:kafka)

docker-compose --profile kafka up -d kafka-ui
```

## Docker Compose Profiles

### Default (Development)

- ✅ PostgreSQL database
- ✅ Redis cache
- ❌ Application containers (run locally)

### Production Profile

```bash
docker-compose --profile production up -d
```

- ✅ Full application stack
- ✅ Built containers for web-app and fastify-api

### Tools Profile

```bash
docker-compose --profile tools up -d
```

- ✅ PgAdmin for database management
- 🌐 Access at <http://localhost:8080>

### Kafka Profile

```bash
docker-compose --profile kafka up -d
```

- ✅ Zookeeper + Kafka + Kafka UI
- 🌐 Kafka UI at <http://localhost:8081>

## Environment Configuration

### Database Connection

```bash

# PostgreSQL

Host: localhost
Port: 5432
Database: enterprise_db
Username: enterprise
Password: ${POSTGRES_PASSWORD}
```

### Redis Connection

```bash

# Redis

Host: localhost
Port: 6379
Password: ${REDIS_PASSWORD}
URL: redis://:${REDIS_PASSWORD}@localhost:6379
```

## Security Features

### Development Security

- ✅ **Password authentication** (removed `trust` method)
- ✅ **Resource limits** prevent excessive memory usage
- ✅ **Health checks** ensure service reliability
- ✅ **Isolated network** (`enterprise-dev`)

### Production Security

- ✅ **Separate profiles** for different environments
- ✅ **Environment variable** configuration
- ✅ **Persistent volumes** for data safety

## Troubleshooting

### Reset Development Environment

```bash

# Stop all services

docker-compose down

# Remove volumes (⚠️ deletes all data)

docker-compose down -v

# Restart fresh

docker-compose up -d postgres redis
```

### Check Service Logs

```bash

# View PostgreSQL logs

docker-compose logs postgres

# View Redis logs

docker-compose logs redis

# Follow logs in real-time

docker-compose logs -f postgres redis
```

### Resource Usage

```bash

# Check memory/CPU usage

docker stats

# View container resource limits

docker-compose config
```

## Development Workflow

1. **Start services**: `docker-compose up -d postgres redis`
2. **Run application**: `pnpm run dev`
3. **Make changes**: Hot reload enabled
4. **Test changes**: `pnpm run test:all`
5. **Stop services**: `docker-compose down`

---

**Updated**: August 4, 2025  
**Docker Compose Version**: 3.8+  
**Tested**: macOS, Linux, Windows (WSL2)
