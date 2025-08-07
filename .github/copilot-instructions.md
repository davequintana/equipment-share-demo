# Copilot Instructions for Enterprise NX Monorepo

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is an enterprise-level NX monorepo featuring:

- **Frontend**: React 19 with TypeScript, Vanilla Extract CSS-in-TS, Vite
- **Backend API**: Fastify with JWT authentication
- **Database**: PostgreSQL with Redis caching
- **Messaging**: Apache Kafka for event streaming
- **Infrastructure**: Docker, Kubernetes, AWS CloudFormation
- **Testing**: Playwright for E2E, Vitest for unit tests
- **Documentation**: Storybook for component library

## Architecture Guidelines

### Folder Structure
- `apps/` - Applications (web-app, fastify-api, e2e)
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

#### Code Quality & Security Analysis
- **SonarCloud**: Integrated code quality and security analysis
- **Quality Gate**: Must pass before merging (enforced in CI)
- **Coverage**: Minimum thresholds enforced via SonarCloud
- **Security Hotspots**: All security issues must be resolved
- **ReDoS Testing**: Required for all regex patterns (see Security Guidelines)

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

### Regular Expression Security (ReDoS Prevention)

**Critical: All regex patterns must be ReDoS-safe to prevent Denial of Service attacks**

#### ❌ **Avoid These Dangerous Patterns:**
- Nested quantifiers: `(a+)+`, `(a*)*`, `(a+)*`
- Alternation with overlapping: `(a|a)*`, `(.*|.+)`
- Exponential backtracking: `[^\s@]+@[^\s@]+` (vulnerable to catastrophic backtracking)

#### ✅ **Use These Safe Patterns:**
- **Email Validation** (ReDoS-safe):
  ```typescript
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  // Always add length limits: if (input.length > 254) return false;
  ```

- **URL Validation** (ReDoS-safe):
  ```typescript
  const urlRegex = /^https?:\/\/[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?$/;
  // Limit length: if (input.length > 2048) return false;
  ```

#### **Mandatory ReDoS Testing:**
For every regex pattern, include this test:
```typescript
it('should handle potential ReDoS attack patterns safely', () => {
  const maliciousPatterns = [
    'malicious-pattern-here',
    'another-attack-vector',
  ];
  
  const startTime = Date.now();
  maliciousPatterns.forEach(pattern => {
    yourValidationFunction(pattern);
  });
  const endTime = Date.now();
  
  // Must complete under 100ms even with attack patterns
  expect(endTime - startTime).toBeLessThan(100);
});
```

## Testing Guidelines

### Comprehensive Test Structure
Follow this testing structure for all new features:

#### 1. **Basic Functionality Tests**
- Test default values and initialization
- Test core functionality with happy path scenarios
- Test return values and state changes

#### 2. **Error Handling Tests**
- Test invalid inputs and edge cases
- Test error boundaries and graceful failures
- Test timeout scenarios and resource limits

#### 3. **Integration Tests**
- Test interaction with external dependencies (APIs, databases)
- Test component integration and data flow
- Test authentication and authorization flows

#### 4. **Performance & Security Tests**
- Always include ReDoS protection tests
- Test with large datasets and edge values
- Test timeout scenarios and resource exhaustion

### React Hook Testing Patterns
When testing custom React hooks, follow these patterns:

```typescript
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Use fake timers for time-based hooks
vi.useFakeTimers();

describe('useCustomHook', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    // Clean up event listeners
    document.removeEventListener = vi.fn();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useCustomHook());
    expect(result.current.someValue).toBe(expectedValue);
  });

  it('should handle state changes correctly', () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.updateFunction();
    });
    
    expect(result.current.newState).toBe(expectedNewValue);
  });
});
```

### Enterprise Service Testing Patterns
For services with external dependencies (AWS, databases):

```typescript
import { vi, beforeEach, describe, it, expect } from 'vitest';

// Mock external dependencies
vi.mock('@aws-sdk/client-secrets-manager');
vi.mock('@aws-sdk/client-ssm');

describe('EnterpriseService', () => {
  let service: EnterpriseService;
  let mockSecretsManager: any;

  beforeEach(() => {
    mockSecretsManager = {
      getSecretValue: vi.fn(),
    };
    service = new EnterpriseService();
  });

  describe('Core Functionality', () => {
    it('should handle successful operations', async () => {
      mockSecretsManager.getSecretValue.mockResolvedValue({
        SecretString: JSON.stringify({ key: 'value' })
      });

      const result = await service.getSecret('test-secret');
      expect(result).toEqual({ key: 'value' });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle service errors gracefully', async () => {
      mockSecretsManager.getSecretValue.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(service.getSecret('test-secret'))
        .rejects.toThrow('Service unavailable');
    });
  });

  describe('Security Tests', () => {
    it('should validate inputs against ReDoS attacks', () => {
      const maliciousInputs = ['((a+)+)+b', 'a'.repeat(10000)];
      const startTime = Date.now();
      
      maliciousInputs.forEach(input => {
        expect(() => service.validateInput(input)).not.toThrow();
      });
      
      expect(Date.now() - startTime).toBeLessThan(100);
    });
  });
});
```

#### **Regex Best Practices:**
1. **Use specific character classes** instead of broad negated classes
2. **Add length limits** before regex validation
3. **Prefer bounded quantifiers** `{0,61}` over unbounded `+` or `*`
4. **Test with malicious inputs** that could cause exponential backtracking
5. **Consider using libraries** like `validator.js` for common patterns

## Performance Guidelines

- Use NX caching for builds
- Implement proper database indexing
- Use Redis for caching
- Optimize bundle sizes with Vite
- Implement lazy loading where appropriate

## Development Workflow

1. Run `pnpm install` to install dependencies
2. Use `pnpm run dev` to start all services with CSR React app (recommended)
3. Use `pnpm run dev:ssr` to start all services with SSR React app
4. Use `pnpm run serve:web-app` for CSR frontend development only (localhost:4200)
5. Use `pnpm run serve:web-app` for frontend development (localhost:4201)
6. Use `pnpm run serve:fastify-api` for Fastify API only (localhost:3334)
8. Use `docker-compose up` for full stack development with databases
9. Run `pnpm run test:all` for testing all projects
10. Use `npx nx e2e e2e` for end-to-end testing

## Code Generation Guidelines

When generating code:
- Follow existing patterns and structures
- Use proper TypeScript types
- Include error handling
- Add appropriate documentation
- Consider security implications
- Follow the established folder structure
