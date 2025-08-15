import { test, expect } from '@playwright/test';

// Helper function for authentication to reduce duplication and improve parallel efficiency
async function authenticateUser(
  page,
  email = 'admin@example.com',
  password = 'password',
) {
  await page.getByRole('button', { name: 'Login' }).click();
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  const [response] = await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/auth/login'),
      { timeout: 45000 },
    ),
    page.click('button[type="submit"]'),
  ]);

  return response;
}

test.describe('Enterprise App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for servers to be ready before running tests
    await page.goto('http://localhost:4200');

    // Wait for the main content to load, indicating the app is ready
    await expect(page.locator('h1')).toBeVisible({ timeout: 45000 });

    // Also check that the API server is responding
    const apiHealthCheck = await page.request.get(
      'http://localhost:3334/health',
    );
    expect(apiHealthCheck.status()).toBe(200);
  });

  test('should display welcome page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(
      'Welcome to Enterprise NX Monorepo',
    );
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create Account' }),
    ).toBeVisible();
  });

  test('should navigate to login and authenticate', async ({ page }) => {
    const response = await authenticateUser(page);

    // Verify the login was successful
    expect(response.status()).toBe(200);

    // Give the React state a moment to update after successful login
    await page.waitForTimeout(2000);

    // Wait for navigation to dashboard
    await expect(page.locator('h1')).toContainText('Enterprise NX Monorepo');
    await expect(page.locator('nav')).toContainText('Welcome, Admin User');
  });

  test('should display features grid after login', async ({ page }) => {
    // Login first using helper
    const response = await authenticateUser(page);

    // Verify the login was successful
    expect(response.status()).toBe(200);

    // Give the React state a moment to update after successful login
    await page.waitForTimeout(2000);

    // Check features are displayed
    await expect(page.getByRole('heading', { name: 'React 19' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'NX Monorepo', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Vanilla Extract' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Fastify API' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'PostgreSQL' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Apache Kafka' }),
    ).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first using helper
    const response = await authenticateUser(page);

    // Verify the login was successful
    expect(response.status()).toBe(200);

    // Wait for the API call to complete and the page to update
    // Give the React state a moment to update after successful login
    await page.waitForTimeout(1000);

    // Wait for dashboard to load and ensure we're logged in
    await expect(page.locator('h1')).toContainText('Enterprise NX Monorepo');

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click({ force: true });

    // Give time for React state to update after logout (localStorage clear + state update)
    await page.waitForTimeout(1000);

    // Should return to welcome page
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should handle login errors', async ({ page }) => {
    // Try with wrong credentials using helper
    await authenticateUser(page, 'wrong@example.com', 'wrongpassword');

    // Wait a moment for potential error handling
    await page.waitForTimeout(1000);

    // For now, just verify we're still on the login page (not redirected)
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('API health checks', async ({ request }) => {
    // Test Fastify API health
    const fastifyHealth = await request.get('http://localhost:3334/health');
    expect(fastifyHealth.ok()).toBeTruthy();
    const fastifyData = await fastifyHealth.json();
    expect(fastifyData.status).toBe('OK');
  });

  test('API authentication flow', async ({ request }) => {
    // Test Fastify API login
    const loginResponse = await request.post(
      'http://localhost:3334/api/auth/login',
      {
        data: {
          email: 'admin@example.com',
          password: 'password',
        },
      },
    );

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeDefined();
    expect(loginData.user.email).toBe('admin@example.com');

    // Test protected route with token
    const profileResponse = await request.get(
      'http://localhost:3334/api/users/profile',
      {
        headers: {
          Authorization: `Bearer ${loginData.token}`,
        },
      },
    );

    expect(profileResponse.ok()).toBeTruthy();
    const profileData = await profileResponse.json();
    expect(profileData.user.email).toBe('admin@example.com');
  });
});
