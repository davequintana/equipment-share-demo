import { test, expect } from '@playwright/test';

test.describe('Enterprise App E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4201');
  });

  test('should display welcome page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Welcome to Enterprise NX Monorepo');
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('should navigate to login and authenticate', async ({ page }) => {
    // Click login button
    await page.getByRole('button', { name: 'Login' }).click();

    // Fill login form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page.locator('h1')).toContainText('Enterprise NX Monorepo');
    await expect(page.locator('nav')).toContainText('Welcome, Admin User');
  });

  test('should display features grid after login', async ({ page }) => {
    // Login first
    await page.getByRole('button', { name: 'Login' }).click();
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Check features are displayed
    await expect(page.getByRole('heading', { name: 'React 19' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NX Monorepo', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vanilla Extract' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fastify API' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PostgreSQL' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Apache Kafka' })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByRole('button', { name: 'Login' }).click();
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click({ force: true });

    // Should return to welcome page
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should handle login errors', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();

    // Try with wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

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
    const loginResponse = await request.post('http://localhost:3334/api/auth/login', {
      data: {
        email: 'admin@example.com',
        password: 'password'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeDefined();
    expect(loginData.user.email).toBe('admin@example.com');

    // Test protected route with token
    const profileResponse = await request.get('http://localhost:3334/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    expect(profileResponse.ok()).toBeTruthy();
    const profileData = await profileResponse.json();
    expect(profileData.user.email).toBe('admin@example.com');
  });
});
