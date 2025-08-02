# Enterprise NX Monorepo

A comprehensive, enterprise-level full-stack application built with modern technologies and best practices.

## 🚀 Features

### Frontend
- **React 19** with latest concurrent features
- **TypeScript** for type safety
- **Vanilla Extract** for CSS-in-TypeScript styling
- **Vite** for lightning-fast development
- **React Router** for routing
- **Storybook** for component documentation

### Backend
- **Express 4** traditional REST API
- **Fastify** high-performance API with OpenAPI docs
- **JWT Authentication** with bcrypt password hashing
- **PostgreSQL** database with Redis caching
- **Apache Kafka** for event streaming

### Infrastructure
- **Docker** containerization
- **Kubernetes** orchestration
- **AWS CloudFormation** infrastructure as code
- **NX** monorepo tooling with caching

### Testing
- **Playwright** for end-to-end testing
- **Vitest** for unit testing
- **Component testing** with Storybook

## 🏗️ Architecture

```
├── apps/
│   ├── web-app/              # React frontend application
│   ├── express-api/          # Express.js REST API
│   ├── fastify-api/          # Fastify high-performance API
│   └── e2e/                  # Playwright E2E tests
├── libs/                     # Shared libraries
├── infrastructure/
│   ├── postgres/             # Database schemas and migrations
│   └── aws/                  # CloudFormation templates
├── k8s/                      # Kubernetes manifests
├── docker-compose.yml        # Local development stack
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- kubectl (for Kubernetes deployment)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd enterprise-nx-monorepo
   pnpm install
   ```

2. **Start development servers:**
   ```bash
   # Frontend (React app)
   pnpm run serve:web-app
   
   # Backend APIs
   pnpm run serve:express-api
   pnpm run serve:fastify-api
   ```

3. **Or start the full stack with Docker:**
   ```bash
   pnpm run docker:up
   ```

### Access Points
- **Frontend**: http://localhost:4200
- **Express API**: http://localhost:3333
- **Fastify API**: http://localhost:3334
- **Storybook**: http://localhost:6006 (run `pnpm run storybook`)

## 🔐 Authentication

Default credentials for testing:
- **Email**: admin@example.com
- **Password**: password

## 📊 Services Overview

### Frontend (Port 4200)
- React 19 application with authentication
- Responsive design with Vanilla Extract
- Protected routes and JWT token management

### Express API (Port 3333)
- RESTful API with JWT authentication
- User management endpoints
- Health check endpoint: `/health`

### Fastify API (Port 3334)
- High-performance API with OpenAPI documentation
- Event publishing to Kafka
- Health check endpoint: `/health`

### Database Services
- **PostgreSQL**: Primary data storage
- **Redis**: Caching and session storage
- **Kafka**: Event streaming and messaging

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm run serve:web-app          # Start React dev server
pnpm run serve:express-api      # Start Express API
pnpm run serve:fastify-api      # Start Fastify API

# Building
pnpm run build                  # Build all projects
pnpm run build:web-app          # Build frontend only
pnpm run build:express-api      # Build Express API only
pnpm run build:fastify-api      # Build Fastify API only

# Testing
pnpm run test                   # Run all tests
pnpm run e2e                    # Run E2E tests
pnpm run lint                   # Lint all projects

# Docker
pnpm run docker:build           # Build Docker images
pnpm run docker:up              # Start all services
pnpm run docker:down            # Stop all services

# Kubernetes
pnpm run k8s:deploy             # Deploy to Kubernetes
pnpm run k8s:delete             # Remove from Kubernetes

# NX Commands
pnpm run graph                  # View dependency graph
pnpm run affected:build         # Build affected projects
pnpm run affected:test          # Test affected projects
```

### Environment Variables

Create `.env` files for each service:

```bash
# .env (root)
NODE_ENV=development
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://enterprise:password@localhost:5432/enterprise_db
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
```

## 🐳 Docker Deployment

### Local Development
```bash
docker-compose up -d
```

This starts:
- Frontend (Nginx) on port 80
- Express API on port 3333
- Fastify API on port 3334
- PostgreSQL on port 5432
- Redis on port 6379
- Kafka on port 9092
- Kafka UI on port 8080
- pgAdmin on port 8081

### Production Build
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## ☸️ Kubernetes Deployment

### Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n enterprise-app
kubectl get services -n enterprise-app
```

### Remove from Kubernetes
```bash
kubectl delete -f k8s/
```

## ☁️ AWS Deployment

### Prerequisites
- AWS CLI configured
- CloudFormation stack creation permissions

### Deploy Infrastructure
```bash
aws cloudformation create-stack \
  --stack-name enterprise-app \
  --template-body file://infrastructure/aws/cloudformation-template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_IAM
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
# Start services first
npm run serve:web-app &
npm run serve:express-api &
npm run serve:fastify-api &

# Run E2E tests
npm run e2e
```

### Component Testing
```bash
npm run storybook
```

## 📈 Monitoring and Observability

### Health Checks
- Express API: `GET /health`
- Fastify API: `GET /health`

### Logging
- Structured logging with timestamps
- Request/response logging
- Error tracking

### Metrics
- API response times
- Database query performance
- Kafka message throughput

## 🔧 Configuration

### NX Configuration
- Caching enabled for builds and tests
- Dependency graph analysis
- Affected command support

### Database Schema
- User management with bcrypt hashing
- Event logging for Kafka integration
- API request logging
- Proper indexing for performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Check the [troubleshooting guide](docs/TROUBLESHOOTING.md)
- Review the [API documentation](docs/API.md)
- Open an issue for bugs or feature requests

## 🗺️ Roadmap

- [ ] Add GraphQL API option
- [ ] Implement real-time features with WebSockets
- [ ] Add monitoring with Prometheus/Grafana
- [ ] Implement CI/CD pipelines
- [ ] Add multi-tenant support
- [ ] Implement micro-frontend architecture

---

Built with ❤️ using NX, React, TypeScript, and modern development practices.
