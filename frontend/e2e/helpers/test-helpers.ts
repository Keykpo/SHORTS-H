import { Page } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

/**
 * Login helper - logs in a test user
 */
export async function login(page: Page, email: string = 'test@example.com', password: string = 'testpassword123') {
  await page.goto('/');

  // Click login button
  await page.click('text=Iniciar Sesión');

  // Fill credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit
  await page.click('button:has-text("Iniciar Sesión")');

  // Wait for login to complete
  await page.waitForTimeout(2000);
}

/**
 * Mock authenticated state in localStorage
 */
export async function mockAuthState(page: Page, user = { id: '1', username: 'testuser', email: 'test@example.com' }) {
  await page.evaluate((userData) => {
    localStorage.setItem('auth', JSON.stringify({
      user: userData,
      token: 'test_token',
      isAuthenticated: true,
    }));
  }, user);
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  const menuButton = page.locator('[data-testid="user-menu"], button:has([data-testid="user-avatar"])');

  if (await menuButton.isVisible()) {
    await menuButton.click();

    const logoutButton = page.locator('text=/Cerrar.*sesión|Logout|Salir/i');

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/**
 * Scroll to bottom of page
 */
export async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
}

/**
 * Create a fake video file for upload testing
 */
export function createFakeVideoFile(sizeInMB: number = 10) {
  return {
    name: 'test-video.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.alloc(1024 * 1024 * sizeInMB),
  };
}

/**
 * Create a fake image file for thumbnail testing
 */
export function createFakeImageFile() {
  return {
    name: 'thumbnail.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake image data'),
  };
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}
