# Enterprise NX Monorepo

A comprehensive, enterprise-level NX monorepo featuring modern technologies for full-stack development with React 19, TypeScript, Fastify/Express APIs, PostgreSQL, Redis, and Kafka.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- kubectl (for Kubernetes deployment)

### Installation & Development

```bash
# Install dependencies
pnpm install

# Start all services (recommended)
pnpm run dev          # CSR React app + APIs
pnpm run dev:ssr      # SSR React app + APIs

# Or start services individually
pnpm run serve:web-app      # React app (localhost:4200)
pnpm run serve:express-api  # Express API (localhost:3333)
pnpm run serve:fastify-api  # Fastify API (localhost:3334)

# With Docker (full stack)
docker-compose up -d
```

### Access Points
- **Frontend**: http://localhost:4200
- **Express API**: http://localhost:3333 
- **Fastify API**: http://localhost:3334 (with Swagger docs at `/documentation`)

### Default Authentication
- **Email**: `admin@example.com`
- **Password**: `password`

## 📚 Documentation

| Topic | Description |
|-------|-------------|
| [🏗️ Architecture](docs/architecture.md) | Project structure, tech stack, and design patterns |
| [🛠️ Development](docs/development.md) | Development workflows, commands, and best practices |
| [🔐 Authentication](docs/authentication.md) | JWT auth, security features, and API endpoints |
| [🐳 Deployment](docs/deployment.md) | Docker, Kubernetes, and AWS deployment guides |
| [🧪 Testing](docs/testing.md) | Unit tests, E2E tests, and testing strategies |
| [⚙️ Configuration](docs/configuration.md) | Environment variables, NX config, and settings |
| [📊 Monitoring](docs/monitoring.md) | Health checks, logging, and observability |
| [🤝 Contributing](docs/contributing.md) | Development guidelines and contribution process |
| [🆘 Troubleshooting](docs/troubleshooting.md) | Common issues and solutions |

## 🔧 Key Features

✅ **React 19** with SSR support and modern concurrent features  
✅ **Enterprise Authentication** with JWT, rate limiting, and validation  
✅ **High-Performance APIs** with Fastify and traditional Express  
✅ **Type Safety** with TypeScript across the entire stack  
✅ **Modern Styling** with Vanilla Extract CSS-in-TypeScript  
✅ **Comprehensive Testing** with Playwright and Vitest  
✅ **Container Ready** with Docker and Kubernetes support  
✅ **Cloud Native** with AWS CloudFormation templates  
✅ **Event Streaming** with Apache Kafka integration  
✅ **Developer Experience** with NX monorepo tooling and caching  

## 🏗️ Project Structure

```
apps/
├── web-app/          # React 19 frontend with SSR
├── express-api/      # Express.js REST API
├── fastify-api/      # Fastify high-performance API
└── e2e/             # Playwright end-to-end tests

libs/                 # Shared libraries and utilities

infrastructure/
├── docker/          # Docker configurations
├── aws/            # CloudFormation templates
└── database/       # Database schemas and scripts

k8s/                 # Kubernetes manifests
docs/               # Comprehensive documentation
```

## � Technology Stack

**Frontend**: React 19, TypeScript, Vanilla Extract, Vite, React Router, Storybook  
**Backend**: Express 4, Fastify 5, JWT Auth, OpenAPI/Swagger  
**Database**: PostgreSQL, Redis, Kafka  
**Infrastructure**: Docker, Kubernetes, AWS CloudFormation  
**Testing**: Playwright, Vitest, ESLint  
**Tooling**: NX Monorepo, pnpm, TypeScript

## 📈 Performance & Security

- **Enterprise-grade authentication** with bcrypt, JWT tokens, and rate limiting
- **High-performance** Fastify API alongside traditional Express
- **Database optimization** with PostgreSQL connection pooling and Redis caching
- **Security features** including CORS, input validation, and password complexity
- **CDN ready** with optimized static asset builds

## � License

This project is licensed under the MIT License.

---

For detailed information on any topic, please refer to the documentation links above.
