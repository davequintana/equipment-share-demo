# Copilot Instructions for Enterprise NX Monorepo

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is an enterprise-level NX monorepo featuring:

- **Frontend**: React 19 with TypeScript, Vanilla Extract CSS-in-TS, Vite
- **Backend APIs**: Express 4 and Fastify with JWT authentication
- **Database**: PostgreSQL with Redis caching
- **Messaging**: Apache Kafka for event streaming
- **Infrastructure**: Docker, Kubernetes, AWS CloudFormation
- **Testing**: Playwright for E2E, Vitest for unit tests
- **Documentation**: Storybook for component library

## Architecture Guidelines

### Folder Structure
- `apps/` - Applications (web-app, express-api, fastify-api, e2e)
- `libs/` - Shared libraries and utilities
- `infrastructure/` - Infrastructure as Code (Docker, K8s, AWS)
- `k8s/` - Kubernetes manifests

### Code Style Guidelines

1. **TypeScript**: Use strict mode, prefer interfaces over types for object shapes
2. **React**: Use functional components with hooks, avoid default exports
3. **CSS**: Use Vanilla Extract for styling, follow BEM-like naming
4. **API**: RESTful design, consistent error handling, JWT authentication
5. **Database**: Use parameterized queries, proper indexing

### Technology-Specific Guidelines

#### React Components
- Use Vanilla Extract for styling
- Export named components
- Include proper TypeScript interfaces
- Add Storybook stories for reusable components

#### Backend APIs
- Express for traditional REST APIs
- Fastify for high-performance APIs with OpenAPI docs
- JWT authentication with bcrypt password hashing
- Proper error handling middleware

#### Database
- PostgreSQL for primary data storage
- Redis for caching and sessions
- Proper migrations and indexing

#### Testing
- Unit tests with Vitest
- E2E tests with Playwright
- Component testing with Storybook

#### Infrastructure
- Docker for containerization
- Kubernetes for orchestration
- AWS CloudFormation for infrastructure
- Environment-specific configurations

## Security Guidelines

- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper CORS policies
- Use HTTPS in production
- Validate all user inputs
- Implement rate limiting

## Performance Guidelines

- Use NX caching for builds
- Implement proper database indexing
- Use Redis for caching
- Optimize bundle sizes with Vite
- Implement lazy loading where appropriate

## Development Workflow

1. Run `pnpm install` to install dependencies
2. Use `pnpm run dev` to start all services in parallel (recommended)
3. Use `pnpm run serve:web-app` for frontend development only
4. Use `pnpm run serve:express-api` for Express API only
5. Use `pnpm run serve:fastify-api` for Fastify API only
6. Use `docker-compose up` for full stack development with databases
7. Run `pnpm run test:all` for testing all projects
8. Use `npx nx e2e e2e` for end-to-end testing

## Code Generation Guidelines

When generating code:
- Follow existing patterns and structures
- Use proper TypeScript types
- Include error handling
- Add appropriate documentation
- Consider security implications
- Follow the established folder structure
