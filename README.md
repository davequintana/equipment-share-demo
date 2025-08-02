# Enterprise NX Monorepo

A comprehensive, enterprise-ready NX monorepo featuring the latest technologies for full-stack development.

## 🚀 Tech Stack

### Frontend
- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Vanilla Extract** - CSS-in-TypeScript styling
- **React Router** - Client-side routing
- **Vite** - Fast build tool and dev server
- **Storybook** - Component development and documentation

### Backend APIs
- **Express 4** - Traditional Node.js web framework
- **Fastify** - High-performance web framework
- **JWT Authentication** - Secure token-based auth
- **OpenAPI/Swagger** - API documentation
- **TypeScript** - Type-safe backend development

### Infrastructure & DevOps
- **Docker** - Containerization for all services
- **Kubernetes** - Container orchestration
- **AWS CloudFormation** - Infrastructure as Code
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **Kafka** - Event streaming platform

### Testing & Quality
- **Playwright** - End-to-end testing
- **Vitest** - Unit testing
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## 📁 Project Structure

```
apps/
├── web-app/          # React frontend application
├── express-api/      # Express.js API server
└── fastify-api/      # Fastify API server

infrastructure/
├── docker/           # Docker configurations
├── kubernetes/       # K8s manifests
├── aws/             # CloudFormation templates
└── database/        # Database schemas and scripts

e2e/
└── playwright/      # End-to-end tests

docs/
└── storybook/       # Component documentation
```

## 🛠 Development Commands

### Start Development Servers
```bash
# Start React frontend (http://localhost:4200)
npx nx serve web-app

# Start Express API (http://localhost:3333)
npx nx serve express-api

# Start Fastify API (http://localhost:3334)
npx nx serve fastify-api
```

### Build Commands
```bash
# Build all projects
npx nx run-many -t build

# Build specific project
npx nx build web-app
npx nx build express-api
npx nx build fastify-api
```

### Testing
```bash
# Run unit tests
npx nx test web-app
npx nx test express-api
npx nx test fastify-api

# Run E2E tests
npx nx e2e playwright

# Run all tests
npx nx run-many -t test
```

### Linting and Type Checking
```bash
# Lint all projects
npx nx run-many -t lint

# Type check all projects
npx nx run-many -t type-check
```

## 🐳 Docker Development

### Build Docker Images
```bash
# Build all images
docker-compose build

# Build specific service
docker build -f infrastructure/docker/web-app.Dockerfile -t web-app .
docker build -f infrastructure/docker/express-api.Dockerfile -t express-api .
docker build -f infrastructure/docker/fastify-api.Dockerfile -t fastify-api .
```

### Run with Docker Compose
```bash
# Start all services
docker-compose up

# Start specific services
docker-compose up web-app postgres redis

# Run in background
docker-compose up -d
```

## ☸️ Kubernetes Deployment

### Deploy to Local Kubernetes
```bash
# Apply all manifests
kubectl apply -f infrastructure/kubernetes/

# Deploy specific services
kubectl apply -f infrastructure/kubernetes/web-app/
kubectl apply -f infrastructure/kubernetes/express-api/
kubectl apply -f infrastructure/kubernetes/fastify-api/
```

### Check Deployment Status
```bash
# View all pods
kubectl get pods

# View services
kubectl get services

# Check logs
kubectl logs -f deployment/web-app
kubectl logs -f deployment/express-api
kubectl logs -f deployment/fastify-api
```

## ☁️ AWS Deployment

### Deploy Infrastructure
```bash
# Deploy main infrastructure
aws cloudformation deploy \
  --template-file infrastructure/aws/main-infrastructure.yml \
  --stack-name app-infrastructure \
  --capabilities CAPABILITY_IAM

# Deploy EKS cluster
aws cloudformation deploy \
  --template-file infrastructure/aws/eks-cluster.yml \
  --stack-name app-eks-cluster \
  --capabilities CAPABILITY_IAM
```

## 🔐 Authentication

The application includes JWT-based authentication with the following endpoints:

### Express API (Port 3333)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - Get user profile (authenticated)
- `PUT /api/users/profile` - Update user profile (authenticated)

### Fastify API (Port 3334)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (authenticated)
- `POST /api/events` - Publish events (authenticated)
- `GET /health` - Health check

### Default Credentials
- Email: `admin@example.com`
- Password: `password`

## 📊 Monitoring and Observability

- **Health Checks**: Available at `/health` endpoints
- **API Documentation**: Swagger UI available for Fastify API
- **Logging**: Structured logging with request/response tracing
- **Metrics**: Application metrics for monitoring

## 🔧 Environment Variables

Create `.env` files for each environment:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/app_db
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# API URLs
REACT_APP_EXPRESS_API_URL=http://localhost:3333
REACT_APP_FASTIFY_API_URL=http://localhost:3334

# AWS (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Start Development Environment**
   ```bash
   # Start all services in parallel (recommended)
   pnpm run dev
   
   # Or start databases first, then all development servers
   docker-compose up postgres redis -d
   pnpm run dev
   
   # Alternative: start services individually in separate terminals
   pnpm run serve:web-app
   pnpm run serve:express-api  
   pnpm run serve:fastify-api
   ```

3. **Access Applications**
   - Frontend: http://localhost:4200
   - Express API: http://localhost:3333
   - Fastify API: http://localhost:3334
   - Swagger UI: http://localhost:3334/documentation

## 📈 Performance

- **Frontend**: Optimized Vite build with code splitting
- **Backend**: High-performance Fastify alongside traditional Express
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session and application caching
- **CDN Ready**: Static assets optimized for CDN deployment

## 🔄 CI/CD

The project includes GitHub Actions workflows for:
- Automated testing on pull requests
- Building and pushing Docker images
- Deploying to AWS EKS clusters
- Running security scans and code quality checks

## 📚 Additional Resources

- [NX Documentation](https://nx.dev)
- [React Documentation](https://react.dev)
- [Express.js Documentation](https://expressjs.com)
- [Fastify Documentation](https://fastify.dev)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks)
- [Kubernetes Documentation](https://kubernetes.io/docs)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npx nx run-many -t test`
4. Run linting: `npx nx run-many -t lint`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
