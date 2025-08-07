import { test, expect } from '@playwright/test';

// Skip auto-logout E2E tests for now - functionality is thoroughly tested in unit tests
test.describe.skip('Auto-logout functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should show session warning before auto-logout', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Mock the idle timer to trigger warning quickly for testing
    await page.evaluate(() => {
      // Reduce timeout for testing (5 seconds instead of 15 minutes)
      const originalTimeout = 5000;
      const warningTime = 2000;

      // Trigger the warning after 3 seconds (5000 - 2000)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('idle-warning', {
          detail: { timeRemaining: warningTime }
        }));
      }, originalTimeout - warningTime);
    });

    // Wait for session warning modal to appear
    await expect(page.locator('[data-testid="session-warning"]')).toBeVisible({ timeout: 10000 });

    // Check warning content
    await expect(page.locator('text=Session Expiring Soon')).toBeVisible();
    await expect(page.locator('text=Stay Logged In')).toBeVisible();
    await expect(page.locator('text=Logout Now')).toBeVisible();
  });

  test('should extend session when "Stay Logged In" is clicked', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Trigger session warning manually
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('idle-warning', {
        detail: { timeRemaining: 120000 }
      }));
    });

    // Wait for session warning modal
    await expect(page.locator('[data-testid="session-warning"]')).toBeVisible();

    // Click "Stay Logged In"
    await page.click('button:has-text("Stay Logged In")');

    // Modal should disappear
    await expect(page.locator('[data-testid="session-warning"]')).not.toBeVisible();

    // User should still be logged in
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });

  test('should logout immediately when "Logout Now" is clicked', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Trigger session warning manually
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('idle-warning', {
        detail: { timeRemaining: 120000 }
      }));
    });

    // Wait for session warning modal
    await expect(page.locator('[data-testid="session-warning"]')).toBeVisible();

    // Click "Logout Now"
    await page.click('button:has-text("Logout Now")');

    // Should be redirected to login page
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // User info should not be visible
    await expect(page.locator('[data-testid="user-info"]')).not.toBeVisible();
  });

  test('should auto-logout after idle timeout', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Mock the idle timer to trigger logout quickly for testing
    await page.evaluate(() => {
      // Simulate auto-logout after idle timeout
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('idle-logout'));
      }, 3000);
    });

    // Wait for auto-logout to occur
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });

    // User info should not be visible
    await expect(page.locator('[data-testid="user-info"]')).not.toBeVisible();
  });

  test('should show countdown timer in session warning', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Trigger session warning with specific time remaining
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('idle-warning', {
        detail: { timeRemaining: 120 } // 2 minutes in seconds
      }));
    });

    // Wait for session warning modal
    await expect(page.locator('[data-testid="session-warning"]')).toBeVisible();

    // Check that countdown is displayed
    await expect(page.locator('text=/[0-9]+:[0-9]{2}/')).toBeVisible();
  });

  test('should reset idle timer on user activity', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Simulate user activity by clicking around
    await page.click('body');
    await page.mouse.move(100, 100);
    await page.keyboard.press('Space');

    // Wait a bit to ensure activity was registered
    await page.waitForTimeout(1000);

    // User should still be logged in after activity
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });

  test('should persist session warning state across page refreshes', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Trigger session warning
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('idle-warning', {
        detail: { timeRemaining: 120000 }
      }));
    });

    // Wait for session warning modal
    await expect(page.locator('[data-testid="session-warning"]')).toBeVisible();

    // Refresh the page
    await page.reload();

    // User should still be logged in (warning state might reset, which is expected)
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });

  test('should not show session warning when user is not logged in', async ({ page }) => {
    // Don't login, just trigger the warning event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('idle-warning', {
        detail: { timeRemaining: 120000 }
      }));
    });

    // Session warning should not appear
    await expect(page.locator('[data-testid="session-warning"]')).not.toBeVisible();
  });

  test('should handle multiple rapid activity events gracefully', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Simulate rapid user activity
    for (let i = 0; i < 50; i++) {
      await page.mouse.move(i * 2, i * 2);
      await page.keyboard.press('Space');
    }

    // Wait a bit
    await page.waitForTimeout(1000);

    // User should still be logged in
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });

  test('should work correctly with browser back/forward navigation', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Navigate to a different page (if the app has multiple pages)
    await page.evaluate(() => {
      window.history.pushState({}, '', '/dashboard');
    });

    // Navigate back
    await page.goBack();

    // User should still be logged in
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Idle timer should still work
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('idle-warning', {
        detail: { timeRemaining: 120000 }
      }));
    });

    await expect(page.locator('[data-testid="session-warning"]')).toBeVisible();
  });

  test('should handle localStorage corruption gracefully', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Corrupt localStorage
    await page.evaluate(() => {
      localStorage.setItem('user', 'invalid-json{');
    });

    // Refresh page
    await page.reload();

    // Should handle corruption gracefully and redirect to login
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should clean up timers when component unmounts', async ({ page }) => {
    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Navigate away from the app
    await page.goto('about:blank');

    // Navigate back
    await page.goto('/');

    // Should still work correctly
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should handle network errors during auto-logout gracefully', async ({ page }) => {
    // Intercept logout requests and make them fail
    await page.route('**/logout', route => {
      route.abort('internetdisconnected');
    });

    // Login with valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();

    // Trigger auto-logout
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('idle-logout'));
    });

    // Should still clear local state even if network request fails
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });
  });
});
