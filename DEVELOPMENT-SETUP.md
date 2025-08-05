# Development Environment Setup Guide

## Quick Start

### 1. Environment Variables
```bash
# Generate secure environment variables
./scripts/setup-env.sh

# Or copy from template
cp .env.example .env
# Edit .env with your values
```

### 2. Start Development Databases
```bash
# Start only PostgreSQL and Redis for development
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps
```

### 3. Optional Development Tools
```bash
# Start PgAdmin for database management
docker-compose --profile tools up -d pgadmin

# Start Kafka for event streaming development
docker-compose --profile kafka up -d zookeeper kafka kafka-ui
```

### 4. Application Development
```bash
# Start frontend (CSR)
pnpm run serve:web-app

# Start backend API
pnpm run serve:fastify-api

# Or start everything in development mode
pnpm run dev
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
- 🌐 Access at http://localhost:8080

### Kafka Profile
```bash
docker-compose --profile kafka up -d
```
- ✅ Zookeeper + Kafka + Kafka UI
- 🌐 Kafka UI at http://localhost:8081

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
