# Testing

## Overview

Comprehensive testing strategy covering unit tests, integration tests, end-to-end tests, and component testing with modern tools and best practices.

## Testing Stack

- **Vitest** - Fast unit testing framework with TypeScript support
- **Playwright** - End-to-end testing across browsers
- **Storybook** - Component testing and documentation
- **React Testing Library** - Component testing utilities
- **Supertest** - API endpoint testing
- **Jest Mock** - Mocking and spying utilities

## Unit Testing

### Frontend Unit Tests

Run React component and utility tests:

```bash
# Run all frontend tests
npx nx test web-app

# Run in watch mode
npx nx test web-app --watch

# Run with coverage
npx nx test web-app --coverage

# Run specific test file
npx nx test web-app --testNamePattern="LoginComponent"
```

### Backend Unit Tests

Test API endpoints and business logic:

```bash
# Run Fastify API tests
npx nx test fastify-api

# Run Fastify API tests
npx nx test fastify-api

# Run all backend tests
npx nx run-many -t test --projects=fastify-api,fastify-api
```

### Example Component Test

```typescript
// apps/web-app/src/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should submit login form with valid credentials', async () => {
    const mockLogin = jest.fn();
    render(<LoginForm onLogin={mockLogin} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('should display validation errors for invalid input', async () => {
    render(<LoginForm onLogin={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});
```

### Example API Test

```typescript
// apps/fastify-api/src/routes/auth.test.ts
import request from 'supertest';
import { app } from '../main';

describe('Auth Routes', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password'
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('admin@example.com');
  });

  it('should reject invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'wrongpassword'
      })
      .expect(401);
  });

  it('should require authentication for protected routes', async () => {
    await request(app)
      .get('/api/users/profile')
      .expect(401);
  });

  it('should allow access with valid token', async () => {
    // First login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password'
      });

    const token = loginResponse.body.token;

    // Use token for protected route
    await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

## Integration Testing

### Database Integration Tests

```typescript
// apps/fastify-api/src/services/user.test.ts
import { UserService } from './user.service';
import { testDb } from '../test-setup';

describe('UserService Integration', () => {
  beforeEach(async () => {
    await testDb.clear();
  });

  it('should create and retrieve user', async () => {
    const userService = new UserService();
    
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    const createdUser = await userService.create(userData);
    expect(createdUser.id).toBeDefined();
    expect(createdUser.email).toBe(userData.email);

    const retrievedUser = await userService.findById(createdUser.id);
    expect(retrievedUser).toEqual(createdUser);
  });

  it('should hash password on creation', async () => {
    const userService = new UserService();
    
    const userData = {
      email: 'test@example.com',
      password: 'plaintext',
      name: 'Test User'
    };

    const user = await userService.create(userData);
    expect(user.password).not.toBe('plaintext');
    expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
  });
});
```

### API Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration

# Cleanup test environment
docker-compose -f docker-compose.test.yml down
```

## End-to-End Testing

### Playwright Configuration

```typescript
// apps/e2e/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run serve:web-app',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// apps/e2e/tests/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login and access protected page', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    
    // Submit form
    await page.click('[data-testid="login-button"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Admin User');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Invalid email or password');
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Verify redirect to login
    await expect(page).toHaveURL('/login');
  });
});
```

### Running E2E Tests

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx nx e2e e2e

# Run with UI mode
npx nx e2e e2e --ui

# Run specific test
npx nx e2e e2e --grep "Authentication Flow"

# Run in headed mode
npx nx e2e e2e --headed

# Generate test report
npx playwright show-report
```

## Component Testing with Storybook

### Storybook Configuration

```typescript
// apps/web-app/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

export default config;
```

### Component Stories

```typescript
// apps/web-app/src/components/LoginForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'Components/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onLogin: { action: 'login' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithError: Story = {
  args: {},
  parameters: {
    mockData: {
      error: 'Invalid credentials'
    }
  }
};

export const Loading: Story = {
  args: {
    isLoading: true
  }
};
```

### Interactive Testing

```typescript
// apps/web-app/src/components/LoginForm.stories.tsx
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const InteractiveTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test form validation
    await userEvent.click(canvas.getByRole('button', { name: /login/i }));
    await expect(canvas.getByText(/email is required/i)).toBeInTheDocument();

    // Test successful form submission
    await userEvent.type(canvas.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(canvas.getByLabelText(/password/i), 'password123');
    await userEvent.click(canvas.getByRole('button', { name: /login/i }));
  },
};
```

### Running Storybook

```bash
# Start Storybook development server
npx nx run web-app:storybook

# Build Storybook for production
npx nx run web-app:build-storybook

# Run Storybook tests
npx nx run web-app:test-storybook
```

## Performance Testing

### Load Testing with Artillery

```yaml
# performance/load-test.yml
config:
  target: 'http://localhost:3334'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Ramp up load
    - duration: 300
      arrivalRate: 100
      name: Sustained load

scenarios:
  - name: 'Authentication flow'
    weight: 70
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'password'
      - get:
          url: '/api/users/profile'
          headers:
            Authorization: 'Bearer {{ token }}'

  - name: 'Health check'
    weight: 30
    flow:
      - get:
          url: '/health'
```

```bash
# Run load tests
npm install -g artillery
artillery run performance/load-test.yml
```

## Test Data Management

### Test Database Setup

```typescript
// test-setup.ts
import { Pool } from 'pg';
import { readFileSync } from 'fs';

export class TestDatabase {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
    });
  }

  async setup() {
    const schema = readFileSync('infrastructure/database/schema.sql', 'utf8');
    await this.pool.query(schema);
  }

  async clear() {
    await this.pool.query('TRUNCATE TABLE users, events CASCADE');
  }

  async teardown() {
    await this.pool.end();
  }
}
```

### Test Fixtures

```typescript
// test-fixtures.ts
export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'password',
    name: 'Admin User',
    role: 'admin'
  },
  user: {
    email: 'user@example.com',
    password: 'password123',
    name: 'Regular User',
    role: 'user'
  }
};

export const testEvents = {
  userLogin: {
    type: 'user_login',
    userId: 1,
    data: { ip: '127.0.0.1' }
  },
  profileUpdate: {
    type: 'profile_update',
    userId: 1,
    data: { field: 'name', oldValue: 'Old Name', newValue: 'New Name' }
  }
};
```

## CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - run: pnpm install
    
    - name: Run unit tests
      run: npx nx run-many -t test --parallel=3
      
    - name: Run E2E tests
      run: npx nx e2e e2e --headless
      
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: test-results
        path: |
          coverage/
          playwright-report/
```

## Test Coverage

### Coverage Reports

```bash
# Generate coverage for all projects
npx nx run-many -t test --coverage

# Generate coverage for specific project
npx nx test web-app --coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.stories.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

## Best Practices

### Test Organization

- **Unit tests** alongside source files
- **Integration tests** in dedicated folders
- **E2E tests** in separate apps/e2e project
- **Shared test utilities** in libs/testing

### Test Naming

```typescript
// Good: descriptive test names
describe('UserService', () => {
  it('should create user with hashed password', () => {});
  it('should throw error when email already exists', () => {});
  it('should update user profile successfully', () => {});
});

// Avoid: vague test names
describe('UserService', () => {
  it('should work', () => {});
  it('should handle errors', () => {});
});
```

### Test Data

- Use factories for generating test data
- Keep test data minimal and focused
- Clean up test data after each test
- Use meaningful test data that reflects real scenarios
