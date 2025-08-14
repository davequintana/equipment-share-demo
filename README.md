# Enterprise NX Monorepo

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?pr## 🛠️ Technology Stack

**Frontend**: React 19, TypeScript, Vanilla Extract, Vite, React Router, Storybook  
**Backend**: Fastify 5, JWT Auth, OpenAPI/Swagger, Kafka Integration  
**Database**: PostgreSQL, Redis, Apache Kafka  
**Testing**: Playwright E2E, Vitest Unit Tests, ESLint 9  
**Infrastructure**: Docker, Kubernetes, AWS CloudFormation  
**Tooling**: NX Monorepo, pnpm, TypeScript, Node.js 23.6.0  

## ⚡ Performance & Security Features

- **Modern Authentication** with bcrypt, JWT tokens, auto-logout, and session management
- **User Behavior Analytics** with real-time Kafka event streaming and comprehensive tracking
- **High-performance** Fastify 5 API with comprehensive OpenAPI documentation
- **Database optimization** with PostgreSQL connection pooling and Redis caching
- **Security hardened** with ReDoS protection, CORS, input validation, and rate limiting
- **CDN ready** with optimized static asset builds and modern browser featuresna_equipment-share-demo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=davequintana_equipment-share-demo)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=davequintana_equipment-share-demo&metric=coverage)](https://sonarcloud.io/summary/new_code?id=davequintana_equipment-share-demo)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=davequintana_equipment-share-demo&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=davequintana_equipment-share-demo)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=davequintana_equipment-share-demo&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=davequintana_equipment-share-demo)

A comprehensive, enterprise-level NX monorepo featuring modern technologies for full-stack development with React 19, TypeScript, Fastify API, PostgreSQL, Redis, and Kafka.

## 🌐 Live Demo

**🔗 [View Live Application](https://davequintana.github.io/equipment-share-demo/)**

The application is automatically deployed to GitHub Pages from the main branch.

## 🚀 Quick Start

### Prerequisites
- Node.js 23.6.0+ (Current LTS)
- pnpm 9.0.0+
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
pnpm run serve:web-app       # React app (localhost:4200)
pnpm run serve:fastify-api   # Fastify API (localhost:3334)

# With Docker (full stack with Kafka)
pnpm run dev:kafka    # Start databases + Kafka + development servers
```

### Access Points

- **Frontend**: <http://localhost:4200>
- **Fastify API**: <http://localhost:3334> (with Swagger docs at `/documentation`)

### Default Authentication

- **Email**: `admin@example.com`
- **Password**: `password`

## 📚 Documentation

| Topic | Description |
|-------|-------------|
| [📋 Changelog](CHANGELOG.md) | Recent updates, features, and improvements |
| [� User Behavior Tracking](docs/user-behavior-tracking.md) | Kafka-based analytics with ReDoS protection |
| [�️ Development Setup](DEVELOPMENT-SETUP.md) | Prerequisites, installation, and development workflow |
| [🔐 Security Features](SECURITY.md) | Authentication, ReDoS protection, and security best practices |
| [🧪 Testing Guide](docs/testing.md) | Unit tests, E2E tests, and testing strategies |
| [🐳 Deployment](DEPLOYMENT.md) | Docker, Kubernetes, and production deployment |
| [⚙️ Configuration](docs/configuration.md) | Environment variables and settings |

## 🔧 Key Features

✅ **React 19** with SSR support and modern concurrent features  
✅ **Advanced User Behavior Tracking** with Kafka integration and real-time analytics  
✅ **Enterprise Authentication** with JWT, auto-logout, and session management  
✅ **High-Performance API** with Fastify 5 and comprehensive OpenAPI documentation  
✅ **Type Safety** with TypeScript across the entire stack  
✅ **Modern Styling** with Vanilla Extract CSS-in-TypeScript  
✅ **Comprehensive Testing** with Playwright E2E and Vitest unit tests  
✅ **Container Ready** with Docker and Kubernetes support  
✅ **Cloud Native** with AWS CloudFormation templates  
✅ **Event Streaming** with Apache Kafka for real-time user analytics  
✅ **Security Hardened** with ReDoS protection, input validation, and rate limiting  
✅ **Developer Experience** with NX monorepo tooling, caching, and hot reload  

## 🏗️ Project Structure

```text
apps/
├── web-app/          # React 19 SSR application
├── fastify-api/      # Fastify REST API with Kafka integration
└── e2e/              # Playwright E2E tests

libs/                 # Shared libraries and utilities
├── secrets/          # Secure configuration management

infrastructure/
├── docker/          # Docker configurations
├── aws/            # CloudFormation templates
└── database/       # Database schemas and scripts

k8s/                 # Kubernetes manifests
docs/               # Comprehensive documentation
```

## � Technology Stack

**Frontend**: React 19, TypeScript, Vanilla Extract, Vite, React Router, Storybook  
**Backend**: Fastify 5, JWT Auth, OpenAPI/Swagger  
**Database**: PostgreSQL, Redis, Kafka  
**Infrastructure**: Docker, Kubernetes, AWS CloudFormation  
**Testing**: Playwright, Vitest, ESLint  
**Tooling**: NX Monorepo, pnpm, TypeScript

## 📈 Performance & Security

- **Enterprise-grade authentication** with bcrypt, JWT tokens, and rate limiting
- **High-performance** Fastify API with comprehensive documentation
- **Database optimization** with PostgreSQL connection pooling and Redis caching
- **Security features** including CORS, input validation, and password complexity
- **CDN ready** with optimized static asset builds

## � License

This project is licensed under the MIT License.

---

For detailed information on any topic, please refer to the documentation links above.
