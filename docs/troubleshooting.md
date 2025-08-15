# Troubleshooting

## Common Issues and Solutions

This guide covers common issues you might encounter during development and their solutions.

## Environment Issues

### Node.js and pnpm Issues

#### Issue: `pnpm: command not found`

**Solution:**

```bash

# Install pnpm globally

npm install -g pnpm

# Or using Homebrew (macOS)

brew install pnpm

# Verify installation

pnpm --version
```

#### Issue: Node.js version mismatch

**Solution:**

```bash

# Check current Node.js version

node --version

# Install and use Node.js 18+ (recommended)

nvm install 18
nvm use 18
nvm alias default 18

# Verify version

node --version  # Should show v18.x.x
```

#### Issue: `Cannot resolve dependency` errors

**Solution:**

```bash

# Clear pnpm cache

pnpm store prune

# Remove node_modules and reinstall

rm -rf node_modules
pnpm install

# For persistent issues, clear all caches

rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Docker Issues

#### Issue: Docker containers won't start

**Solution:**

```bash

# Check if Docker is running

docker info

# Restart Docker service

sudo systemctl restart docker  # Linux

# Or restart Docker Desktop (macOS/Windows)

# Check container logs

docker-compose logs postgres
docker-compose logs redis
```

#### Issue: Port already in use

**Error:** `bind: address already in use`

**Solution:**

```bash

# Find process using the port

lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :3334  # Fastify API
lsof -i :3334  # Fastify API
lsof -i :4200  # React app

# Kill the process

kill -9 <PID>

# Or use Docker commands

docker-compose down
docker-compose up -d
```

#### Issue: Database connection refused

**Solution:**

```bash

# Check if PostgreSQL container is running

docker-compose ps

# Restart PostgreSQL container

docker-compose restart postgres

# Check PostgreSQL logs

docker-compose logs postgres

# Connect to PostgreSQL to verify

docker-compose exec postgres psql -U enterprise -d enterprise_db
```

## Development Server Issues

### React App Issues

#### Issue: Vite dev server won't start

**Solution:**

```bash

# Clear Vite cache

rm -rf node_modules/.vite

# Check port availability

lsof -i :4200

# Start with different port

npx nx serve web-app --port 4200

# Clear browser cache and cookies


# Disable browser extensions

```

#### Issue: Hot Module Replacement (HMR) not working

**Solution:**

```bash

# Restart dev server

npx nx serve web-app

# Check Vite configuration


# Ensure websocket connection isn't blocked by firewall

# For WSL users, use host IP

npx nx serve web-app --host 0.0.0.0
```

#### Issue: TypeScript compilation errors

**Solution:**

```bash

# Check TypeScript configuration

npx tsc --noEmit

# Clear TypeScript cache

rm -rf apps/web-app/.tsbuildinfo

# Restart TypeScript service in VS Code


# Command: "TypeScript: Restart TS Server"

```

### API Server Issues

#### Issue: Fastify API won't start

**Solution:**

```bash

# Check for syntax errors

npx nx lint fastify-api
npx nx lint fastify-api

# Check environment variables

cat .env

# Start with verbose logging

DEBUG=* npx nx serve fastify-api

# Check database connection

npx nx serve fastify-api --verbose
```

#### Issue: Authentication not working

**Solution:**

```bash

# Verify JWT_SECRET is set

echo $JWT_SECRET

# Check default user exists

docker-compose exec postgres psql -U enterprise -d enterprise_db -c "SELECT * FROM users;"

# Test API endpoints directly

curl -X POST http://localhost:3334/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## Database Issues

### PostgreSQL Issues

#### Issue: Database connection timeout

**Solution:**

```bash

# Check PostgreSQL status

docker-compose exec postgres pg_isready

# Increase connection timeout

export DATABASE_TIMEOUT=30000

# Check PostgreSQL configuration

docker-compose exec postgres cat /var/lib/postgresql/data/postgresql.conf
```

#### Issue: Database migration failures

**Solution:**

```bash

# Check migration status

npx nx run database:migration:status

# Rollback last migration

npx nx run database:migration:down

# Recreate database

docker-compose down postgres
docker volume rm app-starter_postgres_data
docker-compose up -d postgres

# Wait for PostgreSQL to start, then run migrations

sleep 10
npx nx run database:migration:up
```

#### Issue: Permission denied errors

**Solution:**

```bash

# Fix PostgreSQL permissions

docker-compose exec postgres chown -R postgres:postgres /var/lib/postgresql/data

# Restart PostgreSQL

docker-compose restart postgres

# Grant permissions

docker-compose exec postgres psql -U enterprise -d enterprise_db -c "GRANT ALL PRIVILEGES ON DATABASE enterprise_db TO enterprise;"
```

### Redis Issues

#### Issue: Redis connection refused

**Solution:**

```bash

# Check Redis status

docker-compose exec redis redis-cli ping

# Restart Redis

docker-compose restart redis

# Check Redis configuration

docker-compose exec redis redis-cli CONFIG GET "*"

# Clear Redis data if needed

docker-compose exec redis redis-cli FLUSHALL
```

## Build Issues

### NX Build Issues

#### Issue: Build fails with memory errors

**Solution:**

```bash

# Increase Node.js memory limit

export NODE_OPTIONS="--max-old-space-size=4096"

# Build projects individually

npx nx build web-app
npx nx build fastify-api
npx nx build fastify-api

# Clear NX cache

npx nx reset
```

#### Issue: Dependency graph errors

**Solution:**

```bash

# Clear NX cache

npx nx reset

# Reinstall dependencies

rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for circular dependencies

npx nx graph
```

### TypeScript Build Issues

#### Issue: Type checking errors

**Solution:**

```bash

# Run type checking

npx nx run-many -t type-check

# Fix import/export issues


# Ensure all imports have proper file extensions in TypeScript

# Update TypeScript configuration


# Check tsconfig.json for proper paths

```

## Testing Issues

### Unit Test Issues

#### Issue: Tests failing after changes

**Solution:**

```bash

# Clear test cache

npx nx reset

# Run tests in watch mode

npx nx test web-app --watch

# Update snapshots if needed

npx nx test web-app --updateSnapshot

# Check test configuration

cat apps/web-app/vitest.config.ts
```

#### Issue: Test coverage issues

**Solution:**

```bash

# Generate coverage report

npx nx test web-app --coverage

# Check coverage thresholds


# Update vitest.config.ts if needed

# Exclude test files from coverage


# Add to coverage.exclude in vitest.config.ts

```

### E2E Test Issues

#### Issue: Playwright tests failing

**Solution:**

```bash

# Install Playwright browsers

npx playwright install

# Run in headed mode for debugging

npx nx e2e e2e --headed

# Update browser snapshots

npx nx e2e e2e --update-snapshots

# Check test configuration

cat apps/e2e/playwright.config.ts
```

#### Issue: Test environment setup

**Solution:**

```bash

# Ensure test database is clean

docker-compose exec postgres psql -U enterprise -d test_db -c "TRUNCATE TABLE users CASCADE;"

# Start services before running E2E tests

pnpm run serve:web-app &
pnpm run serve:fastify-api &
sleep 10
npx nx e2e e2e
```

## Production Issues

### Deployment Issues

#### Issue: Docker build failures

**Solution:**

```bash

# Build with verbose output

docker build --no-cache -f infrastructure/docker/web-app.Dockerfile -t web-app .

# Check Dockerfile syntax

docker run --rm -i hadolint/hadolint < infrastructure/docker/web-app.Dockerfile

# Build for specific platform

docker build --platform linux/amd64 -f infrastructure/docker/web-app.Dockerfile -t web-app .
```

#### Issue: Kubernetes deployment failures

**Solution:**

```bash

# Check deployment status

kubectl get deployments
kubectl get pods
kubectl describe pod <pod-name>

# Check logs

kubectl logs -f deployment/web-app
kubectl logs -f deployment/fastify-api

# Check resource limits

kubectl top pods
kubectl describe node
```

### Performance Issues

#### Issue: High memory usage

**Solution:**

```bash

# Monitor memory usage

docker stats

# Check for memory leaks

node --inspect apps/fastify-api/dist/main.js

# Optimize database queries


# Add indexes for frequently queried fields

```

#### Issue: Slow API responses

**Solution:**

```bash

# Enable API logging

export LOG_LEVEL=debug

# Monitor database query performance

docker-compose exec postgres psql -U enterprise -d enterprise_db -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Check Redis cache hit rates

docker-compose exec redis redis-cli info stats
```

## Security Issues

### Authentication Issues

#### Issue: JWT tokens not working

**Solution:**

```bash

# Verify JWT_SECRET is set

echo $JWT_SECRET

# Test token generation

curl -X POST http://localhost:3334/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq .

# Check token expiration


# Decode JWT token at jwt.io

```

#### Issue: CORS errors

**Solution:**

```bash

# Check CORS configuration

grep -r "CORS_ORIGINS" .

# Update CORS settings for development

export CORS_ORIGINS="http://localhost:4200"

# Restart API servers

pnpm run serve:fastify-api &
pnpm run serve:fastify-api &
```

## Debugging Tools

### VS Code Debugging

#### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Fastify API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/fastify-api/src/main.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "sourceMaps": true
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run"],
      "env": {
        "NODE_ENV": "test"
      }
    }
  ]
}
```

### Browser Developer Tools

#### Network Tab

- Check API requests and responses
- Verify authentication headers
- Monitor request timing

#### Console Tab

- Check for JavaScript errors
- Monitor authentication state
- Debug React components

#### Application Tab

- Check localStorage for tokens
- Monitor cookies
- Inspect service workers

### Database Debugging

#### PostgreSQL Query Analysis

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 0;

-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Getting Help

### Log Collection

```bash

# Collect all logs

mkdir -p debug-logs
docker-compose logs > debug-logs/docker-logs.txt
pnpm run test:all > debug-logs/test-logs.txt 2>&1
npx nx graph --file=debug-logs/dependency-graph.html

# System information

echo "Node.js: $(node --version)" > debug-logs/system-info.txt
echo "pnpm: $(pnpm --version)" >> debug-logs/system-info.txt
echo "Docker: $(docker --version)" >> debug-logs/system-info.txt
echo "OS: $(uname -a)" >> debug-logs/system-info.txt
```

### Issue Reporting

When reporting issues, include:

1. **Environment Information**
   - Operating system
   - Node.js version
   - pnpm version
   - Docker version

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots if applicable

3. **Error Messages**
   - Complete error messages
   - Stack traces
   - Browser console errors

4. **Relevant Configuration**
   - Environment variables
   - Configuration files
   - Recent changes

### Support Channels

- **GitHub Issues**: For bugs and feature requests
- **Documentation**: Check `/docs` directory first
- **API Documentation**: Available at service endpoints
- **Community**: Discussion forums and chat
