# Contributing

## Development Guidelines

Thank you for contributing to the Enterprise NX Monorepo! This guide outlines our development practices, coding standards, and contribution process.

## Getting Started

### Development Environment Setup

1. **Prerequisites**
   - Node.js 18+ (use nvm for version management)
   - pnpm (package manager)
   - Docker & Docker Compose
   - Git

2. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd enterprise-nx-monorepo
   pnpm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

4. **Start Development Environment**
   ```bash
   pnpm run dev
   ```

### Branch Strategy

We follow **GitFlow** branching strategy:

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features
- **`feature/*`** - New features and enhancements
- **`bugfix/*`** - Bug fixes
- **`hotfix/*`** - Critical production fixes
- **`release/*`** - Release preparation

### Branch Naming Conventions

```bash
feature/auth-rate-limiting
feature/user-profile-management
bugfix/login-validation-error
hotfix/critical-security-patch
release/v1.2.0
```

## Coding Standards

### TypeScript Guidelines

1. **Strict Type Safety**
   ```typescript
   // ✅ Good: Explicit types
   interface User {
     id: number;
     email: string;
     name: string;
   }

   function getUserById(id: number): Promise<User | null> {
     return userService.findById(id);
   }

   // ❌ Avoid: Any types
   function getUser(id: any): any {
     return userService.findById(id);
   }
   ```

2. **Interface over Type Aliases**
   ```typescript
   // ✅ Preferred: Interfaces for object shapes
   interface ApiResponse<T> {
     data: T;
     success: boolean;
     message?: string;
   }

   // ✅ Acceptable: Type aliases for unions
   type Theme = 'light' | 'dark' | 'auto';
   ```

3. **Consistent Naming**
   ```typescript
   // ✅ Good: PascalCase for interfaces, camelCase for functions
   interface UserProfile {
     firstName: string;
     lastName: string;
   }

   function validateUserInput(input: UserInput): ValidationResult {
     // implementation
   }
   ```

### React Component Guidelines

1. **Functional Components with Hooks**
   ```typescript
   // ✅ Preferred: Functional component with TypeScript
   interface LoginFormProps {
     onLogin: (credentials: LoginCredentials) => void;
     isLoading?: boolean;
   }

   export function LoginForm({ onLogin, isLoading = false }: LoginFormProps): JSX.Element {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');

     return (
       <form onSubmit={handleSubmit}>
         {/* component JSX */}
       </form>
     );
   }
   ```

2. **Named Exports**
   ```typescript
   // ✅ Good: Named exports
   export function LoginForm() { /* ... */ }
   export function UserProfile() { /* ... */ }

   // ❌ Avoid: Default exports for components
   export default function LoginForm() { /* ... */ }
   ```

3. **Component Organization**
   ```
   src/components/
   ├── LoginForm/
   │   ├── LoginForm.tsx
   │   ├── LoginForm.test.tsx
   │   ├── LoginForm.stories.tsx
   │   ├── LoginForm.css.ts      # Vanilla Extract styles
   │   └── index.ts              # Re-export
   ```

### Styling Guidelines

1. **Vanilla Extract CSS-in-TypeScript**
   ```typescript
   // LoginForm.css.ts
   import { style } from '@vanilla-extract/css';

   export const container = style({
     display: 'flex',
     flexDirection: 'column',
     gap: '1rem',
     padding: '2rem',
     backgroundColor: 'white',
     borderRadius: '8px',
     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
   });

   export const input = style({
     padding: '0.75rem',
     border: '1px solid #ddd',
     borderRadius: '4px',
     fontSize: '1rem'
   });
   ```

2. **BEM-like Class Naming**
   ```typescript
   export const formContainer = style({ /* styles */ });
   export const formInput = style({ /* styles */ });
   export const formButton = style({ /* styles */ });
   export const formButtonPrimary = style({ /* styles */ });
   ```

### Backend API Guidelines

1. **RESTful API Design**
   ```typescript
   // ✅ Good: RESTful endpoints
   GET    /api/users              // Get all users
   GET    /api/users/:id          // Get specific user
   POST   /api/users              // Create new user
   PUT    /api/users/:id          // Update user
   DELETE /api/users/:id          // Delete user

   // Authentication
   POST   /api/auth/login         // Login
   POST   /api/auth/register      // Register
   POST   /api/auth/logout        // Logout
   ```

2. **Consistent Error Handling**
   ```typescript
   // Error response format
   interface ApiError {
     error: string;
     code: number;
     details?: any;
     timestamp: string;
   }

   // Implementation
   app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
     const apiError: ApiError = {
       error: error.message,
       code: res.statusCode || 500,
       timestamp: new Date().toISOString()
     };

     logger.error('API Error', { error: apiError, requestId: req.requestId });
     res.status(apiError.code).json(apiError);
   });
   ```

3. **Input Validation**
   ```typescript
   // Use JSON schemas for validation
   const loginSchema = {
     type: 'object',
     required: ['email', 'password'],
     properties: {
       email: { type: 'string', format: 'email' },
       password: { type: 'string', minLength: 8 }
     }
   };

   // Fastify validation
   fastify.post('/api/auth/login', {
     schema: {
       body: loginSchema
     }
   }, async (request, reply) => {
     // Handler implementation
   });
   ```

## Testing Standards

### Unit Testing

1. **Test Structure**
   ```typescript
   // LoginForm.test.tsx
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import { LoginForm } from './LoginForm';

   describe('LoginForm', () => {
     describe('validation', () => {
       it('should display error when email is invalid', async () => {
         // Test implementation
       });

       it('should display error when password is too short', async () => {
         // Test implementation
       });
     });

     describe('submission', () => {
       it('should call onLogin with valid credentials', async () => {
         // Test implementation
       });
     });
   });
   ```

2. **Test Naming**
   ```typescript
   // ✅ Good: Descriptive test names
   it('should display validation error when email format is invalid')
   it('should submit form when all fields are valid')
   it('should disable submit button when form is loading')

   // ❌ Avoid: Vague test names
   it('should work')
   it('should handle errors')
   ```

### API Testing

```typescript
// auth.test.ts
import request from 'supertest';
import { app } from '../main';

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(/^eyJ/); // JWT format
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });
  });
});
```

## Git Workflow

### Commit Message Convention

We follow **Conventional Commits** specification:

```bash
# Format
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

# Examples
feat(auth): add rate limiting to login endpoint
fix(ui): resolve button alignment issue in mobile view
docs(readme): update installation instructions
test(api): add integration tests for user endpoints
refactor(db): optimize user query performance
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "feat(auth): add rate limiting to login endpoint"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR through GitHub interface
   ```

4. **PR Requirements**
   - All tests pass
   - Code review approval
   - Documentation updated
   - No merge conflicts

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added for new functionality

## Screenshots (if applicable)
Add screenshots to help explain your changes.
```

## Code Review Guidelines

### What to Look For

1. **Code Quality**
   - Follows TypeScript best practices
   - Proper error handling
   - No console.log statements in production code
   - Consistent naming conventions

2. **Security**
   - Input validation and sanitization
   - Proper authentication checks
   - No hardcoded secrets
   - SQL injection prevention

3. **Performance**
   - Efficient algorithms
   - Proper database queries
   - Minimal bundle size impact
   - Memory leak prevention

4. **Testing**
   - Adequate test coverage
   - Meaningful test cases
   - Tests actually test the intended functionality

### Review Process

1. **Author Responsibilities**
   - Self-review before requesting review
   - Provide clear PR description
   - Respond to feedback promptly
   - Keep PRs reasonably sized

2. **Reviewer Responsibilities**
   - Review within 24-48 hours
   - Provide constructive feedback
   - Test locally if needed
   - Approve only when confident

## Documentation Standards

### Code Documentation

1. **Function Documentation**
   ```typescript
   /**
    * Authenticates a user with email and password
    * @param email - User's email address
    * @param password - User's plain text password
    * @returns Promise resolving to authentication result
    * @throws AuthenticationError when credentials are invalid
    */
   async function authenticateUser(
     email: string, 
     password: string
   ): Promise<AuthResult> {
     // Implementation
   }
   ```

2. **Complex Logic Comments**
   ```typescript
   // Rate limiting: Allow max 5 attempts per 15-minute window
   if (!checkRateLimit(req.ip)) {
     throw new TooManyRequestsError('Rate limit exceeded');
   }
   ```

### API Documentation

Use OpenAPI/Swagger for API documentation:

```typescript
// Fastify route with OpenAPI schema
fastify.post('/api/auth/login', {
  schema: {
    summary: 'User login',
    description: 'Authenticate user with email and password',
    tags: ['Authentication'],
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/definitions/User' }
        }
      },
      401: { $ref: '#/definitions/Error' }
    }
  }
}, loginHandler);
```

## Release Process

### Version Management

We use **Semantic Versioning** (SemVer):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. **Prepare Release**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.2.0
   ```

2. **Update Version and Changelog**
   ```bash
   # Update package.json versions
   pnpm version 1.2.0

   # Update CHANGELOG.md
   # Run final tests
   pnpm run test:all
   ```

3. **Merge to Main**
   ```bash
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push origin main --tags
   ```

4. **Deploy to Production**
   - CI/CD pipeline automatically deploys tagged releases
   - Monitor deployment and application health

## Getting Help

### Resources

- **Documentation**: Check `/docs` directory
- **API Docs**: Available at `/documentation` endpoints
- **Storybook**: Component documentation
- **GitHub Issues**: Bug reports and feature requests

### Communication

- **Code Questions**: Comment on PRs or create issues
- **Architecture Decisions**: Discuss in team meetings
- **Bug Reports**: Create detailed GitHub issues
- **Feature Requests**: Use feature request template

### Development Support

```bash
# Common development tasks
pnpm run dev              # Start development environment
pnpm run test:all         # Run all tests
pnpm run lint:fix         # Fix linting issues
pnpm run build            # Build all projects
npx nx graph              # View dependency graph
npx nx affected:test      # Test affected projects
```

Thank you for contributing to the Enterprise NX Monorepo! 🚀
