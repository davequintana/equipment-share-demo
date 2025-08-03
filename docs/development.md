# Development Guide

## Getting Started

### Prerequisites

- **Node.js 18+** (recommended: use nvm for version management)
- **pnpm** (package manager)
- **Docker & Docker Compose** (for databases and containerization)
- **kubectl** (for Kubernetes deployments)
- **AWS CLI** (for cloud deployments)

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd enterprise-nx-monorepo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local configuration
```

## Development Commands

### Start All Services

```bash
# Start all services with Client-Side Rendering (recommended)
pnpm run dev

# Start all services with Server-Side Rendering
pnpm run dev:ssr

# Start with Docker (includes databases)
docker-compose up -d
pnpm run dev
```

### Individual Services

```bash
# Frontend only
pnpm run serve:web-app         # CSR React app (port 4200)
pnpm run serve:web-app       # React app with SSR (port 4201)

# Backend API
pnpm run serve:fastify-api     # Fastify API (port 3334)

# Development tools
pnpm run storybook             # Component library (port 6006)
```

### Build Commands

```bash
# Build all projects
pnpm run build
npx nx run-many -t build

# Build specific projects
npx nx build web-app
npx nx build fastify-api
npx nx build fastify-api

# Production builds
npx nx build web-app --configuration=production
```

### Testing

```bash
# Run all tests
pnpm run test:all
npx nx run-many -t test

# Run specific tests
npx nx test web-app
npx nx test fastify-api
npx nx test fastify-api

# End-to-end testing
npx nx e2e e2e
pnpm run e2e

# Watch mode for development
npx nx test web-app --watch
```

### Code Quality

```bash
# Lint all projects
npx nx run-many -t lint

# Lint and fix
npx nx run-many -t lint --fix

# Type checking
npx nx run-many -t type-check

# Format code
npx nx format:write
```

## NX Workspace Commands

### Dependency Graph

```bash
# View project dependency graph
npx nx graph

# Show affected projects
npx nx show projects --affected

# Run commands on affected projects only
npx nx affected:build
npx nx affected:test
npx nx affected:lint
```

### Project Management

```bash
# Generate new application
npx nx g @nx/react:app my-new-app

# Generate new library
npx nx g @nx/react:lib my-new-lib

# Generate component
npx nx g @nx/react:component my-component --project=web-app
```

## Docker Development

### Local Development with Docker

```bash
# Start databases only
docker-compose up postgres redis kafka -d

# Start all services
docker-compose up

# Build specific images
docker-compose build web-app
docker-compose build fastify-api
docker-compose build fastify-api

# View logs
docker-compose logs -f web-app
docker-compose logs -f fastify-api
```

### Docker Commands

```bash
# Build production images
docker build -f infrastructure/docker/web-app.Dockerfile -t web-app .
docker build -f infrastructure/docker/fastify-api.Dockerfile -t fastify-api .
docker build -f infrastructure/docker/fastify-api.Dockerfile -t fastify-api .

# Run individual containers
docker run -p 4200:80 web-app
docker run -p 3334:3334 fastify-api
docker run -p 3334:3334 fastify-api
```

## Database Operations

### PostgreSQL

```bash
# Connect to database
docker-compose exec postgres psql -U enterprise -d enterprise_db

# Run migrations
npx nx run database:migrate

# Seed data
npx nx run database:seed

# Reset database
npx nx run database:reset
```

### Redis

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis operations
docker-compose exec redis redis-cli monitor

# Check Redis info
docker-compose exec redis redis-cli info
```

## Environment Configuration

### Environment Variables

Create `.env` file in the root directory:

```bash
# Application
NODE_ENV=development
PORT=3333

# Database
DATABASE_URL=postgresql://enterprise:password@localhost:5432/enterprise_db
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# API URLs
REACT_APP_FASTIFY_API_URL=http://localhost:3334
REACT_APP_FASTIFY_API_URL=http://localhost:3334

# Kafka
KAFKA_BROKERS=localhost:9092

# AWS (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Per-Environment Configuration

```bash
# Development
.env.development

# Production
.env.production

# Testing
.env.test
```

## Development Workflow

### Feature Development

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Start development servers**
   ```bash
   pnpm run dev
   ```

3. **Make changes and test**
   ```bash
   # Run tests while developing
   npx nx test web-app --watch
   
   # Check affected projects
   npx nx affected:build
   npx nx affected:test
   ```

4. **Code quality checks**
   ```bash
   npx nx run-many -t lint --fix
   npx nx format:write
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

### Hot Reloading

- **Frontend**: Vite provides instant HMR
- **Backend**: Nodemon restarts APIs on file changes
- **Types**: TypeScript compilation in watch mode

### Debugging

#### Frontend Debugging

- Use React Developer Tools
- Browser DevTools with source maps
- Console logging and debugging

#### Backend Debugging

```bash
# Debug Fastify API
npx nx serve fastify-api --inspect

# Debug Fastify API
npx nx serve fastify-api --inspect

# Use with VS Code debugger
```

#### Database Debugging

```bash
# Enable query logging in development
DATABASE_LOGGING=true pnpm run serve:fastify-api

# Monitor database connections
docker-compose exec postgres psql -U enterprise -d enterprise_db -c "SELECT * FROM pg_stat_activity;"
```

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npx nx build web-app --analyze

# Production builds with optimization
npx nx build web-app --configuration=production
```

### Development Performance

- Use NX caching for faster builds
- Run only affected tests and builds
- Utilize code splitting and lazy loading

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Find process using port
   lsof -i :3334
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database connection issues**
   ```bash
   # Restart database
   docker-compose restart postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

3. **Node modules issues**
   ```bash
   # Clear and reinstall
   rm -rf node_modules
   pnpm install
   ```

4. **NX cache issues**
   ```bash
   # Clear NX cache
   npx nx reset
   ```

### Performance Issues

- Monitor memory usage with `docker stats`
- Check database query performance
- Profile frontend bundles for optimization
- Monitor API response times
