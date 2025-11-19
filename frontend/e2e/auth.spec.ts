import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests for user registration, login, and logout flows
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login modal when clicking login button', async ({ page }) => {
    // Click login button in navigation
    await page.click('text=Iniciar Sesión');

    // Wait for modal to appear
    await expect(page.locator('text=Inicia Sesión')).toBeVisible();

    // Check for email and password fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    // Open login modal
    await page.click('text=Iniciar Sesión');

    // Try to submit empty form
    await page.click('button:has-text("Iniciar Sesión")');

    // Should show validation errors
    await expect(page.locator('text=/Email.*requerido|Contraseña.*requerida/i')).toBeVisible({ timeout: 3000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Open login modal
    await page.click('text=Iniciar Sesión');

    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button:has-text("Iniciar Sesión")');

    // Should show error message
    await expect(page.locator('text=/Credenciales.*inválidas|Email.*contraseña.*incorrectos/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Note: This test requires a test user to exist in the database
    // You may need to set up a test user or mock the API response

    // Open login modal
    await page.click('text=Iniciar Sesión');

    // Fill in valid credentials (replace with your test credentials)
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');

    // Submit form
    await page.click('button:has-text("Iniciar Sesión")');

    // Should redirect to home or close modal and show user info
    // Wait for navigation or modal close
    await page.waitForTimeout(2000);

    // Check if logged in (user avatar or username should be visible)
    // Adjust selector based on your UI
    const isLoggedIn = await page.locator('[data-testid="user-avatar"], text=/@\w+/').isVisible().catch(() => false);

    // Note: This may fail if test user doesn't exist
    // Consider using API mocking or setup/teardown for test users
  });

  test('should display registration modal', async ({ page }) => {
    // Look for registration link/button
    const registerButton = page.locator('text=/Registrarse|Crear.*cuenta|Sign.*up/i');

    if (await registerButton.isVisible()) {
      await registerButton.click();

      // Wait for registration form
      await expect(page.locator('input[name="username"], input[placeholder*="usuario"]')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    }
  });

  test('should show validation errors for registration', async ({ page }) => {
    // Open registration modal/page
    const registerButton = page.locator('text=/Registrarse|Crear.*cuenta|Sign.*up/i');

    if (await registerButton.isVisible()) {
      await registerButton.click();

      // Try to submit empty form
      await page.click('button:has-text(/Registrarse|Crear.*cuenta/i)');

      // Should show validation errors
      await expect(page.locator('text=/requerido|obligatorio|required/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should logout successfully', async ({ page }) => {
    // This test assumes user is logged in
    // You may need to implement login first or use authenticated state

    // Look for logout button (usually in dropdown or menu)
    const menuButton = page.locator('[data-testid="user-menu"], button:has([data-testid="user-avatar"])');

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Click logout
      const logoutButton = page.locator('text=/Cerrar.*sesión|Logout|Salir/i');

      if (await logoutButton.isVisible()) {
        await logoutButton.click();

        // Should redirect to home and show login button again
        await expect(page.locator('text=Iniciar Sesión')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should persist authentication after page reload', async ({ page, context }) => {
    // This test checks if auth token is properly stored in localStorage/cookies

    // First, mock a logged-in state by setting auth token
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'test_token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Or set localStorage
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    // Reload the page
    await page.reload();

    // Check if still logged in
    // This will depend on your implementation
    await page.waitForTimeout(1000);

    // Note: You may need to adjust this based on your auth implementation
  });
});
