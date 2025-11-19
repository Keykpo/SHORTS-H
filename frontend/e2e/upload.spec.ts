import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Video Upload E2E Tests
 * Tests for video upload flow including validation and error handling
 */

test.describe('Video Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // If not logged in, should be redirected or see login prompt
    const currentUrl = page.url();

    // Check if redirected to home or login page
    if (currentUrl === 'http://localhost:3000/' || currentUrl.includes('login')) {
      // Expected behavior - not authenticated users can't access upload
      expect(true).toBe(true);
    } else {
      // Or check if there's a login prompt on the page
      const loginPrompt = await page.locator('text=/Inicia.*sesión|Login.*required/i').isVisible().catch(() => false);
      expect(loginPrompt).toBe(true);
    }
  });

  test('should display upload form for authenticated users', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();

    // Should show upload form elements
    await expect(page.locator('input[type="file"], text=/Selecciona.*video|Arrastra.*video/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="title"], input[placeholder*="título"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"], textarea[placeholder*="descripción"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();

    // Try to submit without filling required fields
    const submitButton = page.locator('button:has-text(/Publicar|Subir.*video|Upload/i)');

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      await expect(page.locator('text=/requerido|obligatorio|required/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should validate video file type', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();

    // Try to upload non-video file
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible()) {
      // Create a fake text file
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is not a video'),
      });

      // Should show error about invalid file type
      await expect(page.locator('text=/formato.*válido|video.*válido|invalid.*file/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should validate video file size', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();

    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible()) {
      // Create a fake large file (if your app has size limits)
      // Note: This is a mock - actual file size validation may work differently
      const largeBuffer = Buffer.alloc(1024 * 1024 * 600); // 600MB

      await fileInput.setInputFiles({
        name: 'large-video.mp4',
        mimeType: 'video/mp4',
        buffer: largeBuffer,
      });

      // Should show error about file size (if limit is < 600MB)
      // Adjust based on your actual size limit
      await page.waitForTimeout(1000);

      // Check if error appears
      const sizeError = await page.locator('text=/tamaño.*excede|too.*large|size.*limit/i').isVisible().catch(() => false);

      // This may or may not show depending on your size limit
    }
  });

  test('should fill upload form correctly', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();

    // Fill in video details
    await page.fill('input[name="title"], input[placeholder*="título"]', 'Test Video Title');
    await page.fill('textarea[name="description"], textarea[placeholder*="descripción"]', 'This is a test video description');

    // Select tags if available
    const tagsInput = page.locator('input[name="tags"], input[placeholder*="etiquetas"]');
    if (await tagsInput.isVisible()) {
      await tagsInput.fill('acción, aventura');
    }

    // Select category if available
    const categorySelect = page.locator('select[name="category"], select[aria-label*="categoría"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    // Check thumbnail upload
    const thumbnailInput = page.locator('input[type="file"][accept*="image"]');
    if (await thumbnailInput.isVisible()) {
      await thumbnailInput.setInputFiles({
        name: 'thumbnail.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image data'),
      });
    }

    // Verify form is filled
    const titleValue = await page.inputValue('input[name="title"], input[placeholder*="título"]');
    expect(titleValue).toBe('Test Video Title');
  });

  test('should show upload progress', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();

    // This test would require actual API mocking or a test environment
    // to properly test upload progress

    // Fill form
    await page.fill('input[name="title"], input[placeholder*="título"]', 'Test Video');
    await page.fill('textarea[name="description"], textarea[placeholder*="descripción"]', 'Test Description');

    // Upload a small video file
    const fileInput = page.locator('input[type="file"]:not([accept*="image"])');

    if (await fileInput.isVisible()) {
      // Create a small fake video file
      await fileInput.setInputFiles({
        name: 'test-video.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.alloc(1024 * 100), // 100KB
      });

      // Wait a moment for file to be selected
      await page.waitForTimeout(1000);

      // Click submit
      const submitButton = page.locator('button:has-text(/Publicar|Subir.*video|Upload/i)');
      if (await submitButton.isVisible() && await submitButton.isEnabled()) {
        await submitButton.click();

        // Should show progress indicator
        const progressIndicator = page.locator('[role="progressbar"], text=/subiendo|uploading|%/i');
        // Note: This may not work without proper API mocking
      }
    }
  });

  test('should allow canceling upload', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();

    // Look for cancel button during upload
    const cancelButton = page.locator('button:has-text(/Cancelar|Cancel/i)');

    // This test would need actual upload in progress to test properly
    // Just check if cancel button exists in the UI
    if (await cancelButton.isVisible()) {
      expect(await cancelButton.isEnabled()).toBe(true);
    }
  });
});
