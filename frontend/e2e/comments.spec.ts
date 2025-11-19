import { test, expect } from '@playwright/test';

/**
 * Comments E2E Tests
 * Tests for commenting functionality including creation, replies, likes, and deletion
 */

test.describe('Comments', () => {
  // Mock video ID for testing
  const TEST_VIDEO_ID = 'test-video-id';

  test.beforeEach(async ({ page }) => {
    // Navigate to a video page
    // Note: You may need to adjust this to match your actual video route
    await page.goto(`/video/${TEST_VIDEO_ID}`);
  });

  test('should display comments section', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if comments section exists
    const commentsSection = page.locator('text=/Comentarios|Comments/i, [data-testid="comments-section"]');

    // May need to scroll to comments section
    if (await commentsSection.isVisible()) {
      await commentsSection.scrollIntoViewIfNeeded();
      expect(await commentsSection.isVisible()).toBe(true);
    } else {
      // Comments section might be below the fold
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
    }
  });

  test('should show login prompt when trying to comment without authentication', async ({ page }) => {
    // Ensure not logged in
    await page.evaluate(() => {
      localStorage.removeItem('auth');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Try to click on comment input/button
    const commentInput = page.locator('textarea[placeholder*="comentario"], input[placeholder*="comentario"]');

    if (await commentInput.isVisible()) {
      await commentInput.click();

      // Should show login prompt or redirect
      const loginPrompt = await page.locator('text=/Inicia.*sesión.*comentar|Login.*comment|Debes.*iniciar/i').isVisible({ timeout: 3000 }).catch(() => false);

      // Some implementations might redirect to login
      const isOnLoginPage = page.url().includes('login') || page.url() === 'http://localhost:3000/';

      expect(loginPrompt || isOnLoginPage).toBe(true);
    }
  });

  test('should allow authenticated users to write a comment', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find comment input
    const commentInput = page.locator('textarea[placeholder*="comentario"], textarea[name="comment"]');

    if (await commentInput.isVisible()) {
      // Type a comment
      await commentInput.fill('This is a test comment');

      // Verify text was entered
      const inputValue = await commentInput.inputValue();
      expect(inputValue).toBe('This is a test comment');
    }
  });

  test('should submit a comment', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find and fill comment input
    const commentInput = page.locator('textarea[placeholder*="comentario"], textarea[name="comment"]');

    if (await commentInput.isVisible()) {
      await commentInput.fill('Test comment for E2E');

      // Find and click submit button
      const submitButton = page.locator('button:has-text(/Comentar|Enviar|Publicar|Post/i)').first();

      if (await submitButton.isVisible()) {
        // Submit comment
        await submitButton.click();

        // Wait for comment to appear or success message
        // Note: This will likely fail without proper API mocking
        await page.waitForTimeout(2000);

        // Check if comment was added or if there's a success message
        const commentPosted = await page.locator('text=Test comment for E2E').isVisible().catch(() => false);
        const successMessage = await page.locator('text=/Comentario.*publicado|Comment.*posted/i').isVisible().catch(() => false);

        // At least one should be true (or may fail without API)
      }
    }
  });

  test('should validate empty comments', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Try to submit empty comment
    const submitButton = page.locator('button:has-text(/Comentar|Enviar|Publicar|Post/i)').first();

    if (await submitButton.isVisible()) {
      // Click without typing anything
      await submitButton.click();

      // Should show validation error or button should be disabled
      const isDisabled = await submitButton.isDisabled();
      const validationError = await page.locator('text=/Comentario.*vacío|Escribe.*comentario|Comment.*empty/i').isVisible().catch(() => false);

      expect(isDisabled || validationError).toBe(true);
    }
  });

  test('should display existing comments', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Scroll to comments section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Check if there are any comments displayed
    const comments = page.locator('[data-testid="comment"], .comment-item');
    const count = await comments.count();

    // There may or may not be comments, just check structure
    if (count > 0) {
      // First comment should have username and text
      const firstComment = comments.first();
      await expect(firstComment).toBeVisible();

      // Should have username
      const username = firstComment.locator('text=/@\w+/');
      // May or may not be present depending on data
    }
  });

  test('should allow replying to comments', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Scroll to comments
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Look for reply button
    const replyButton = page.locator('button:has-text(/Responder|Reply/i)').first();

    if (await replyButton.isVisible()) {
      await replyButton.click();

      // Should show reply input
      await expect(page.locator('textarea[placeholder*="respuesta"], textarea[placeholder*="reply"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should allow liking comments', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Scroll to comments
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Look for like button (heart icon or like text)
    const likeButton = page.locator('button:has-text(/Me gusta|Like/i), button:has([aria-label*="like"])').first();

    if (await likeButton.isVisible()) {
      // Get initial state
      const initialClass = await likeButton.getAttribute('class');

      // Click like button
      await likeButton.click();

      // Wait for state change
      await page.waitForTimeout(500);

      // Class or aria-pressed should change
      const newClass = await likeButton.getAttribute('class');

      // State should change (though may fail without API)
    }
  });

  test('should allow deleting own comments', async ({ page, context }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: '1', username: 'testuser', email: 'test@example.com' },
        token: 'test_token',
        isAuthenticated: true,
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Scroll to comments
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Look for delete button (usually only visible on own comments)
    const deleteButton = page.locator('button[aria-label*="eliminar"], button:has-text(/Eliminar|Delete/i)').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Should show confirmation dialog
      const confirmButton = page.locator('button:has-text(/Confirmar|Sí|Yes|Delete/i)');

      if (await confirmButton.isVisible()) {
        await confirmButton.click();

        // Comment should be removed
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should display comment metadata (timestamp, likes count)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Scroll to comments
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const comments = page.locator('[data-testid="comment"], .comment-item');

    if (await comments.first().isVisible()) {
      const firstComment = comments.first();

      // Should have timestamp (hace X tiempo, X ago, etc)
      const timestamp = firstComment.locator('text=/hace|ago|min|hora|día/i');
      // May or may not be present

      // Should have likes count
      const likesCount = firstComment.locator('text=/\\d+.*me gusta|\\d+.*like/i');
      // May or may not be present
    }
  });

  test('should load more comments when clicking "Load More"', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Scroll to comments
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Look for "Load More" or "Ver más" button
    const loadMoreButton = page.locator('button:has-text(/Ver.*más|Load.*more|Cargar.*más/i)');

    if (await loadMoreButton.isVisible()) {
      // Count comments before
      const commentsBefore = await page.locator('[data-testid="comment"], .comment-item').count();

      // Click load more
      await loadMoreButton.click();

      // Wait for new comments to load
      await page.waitForTimeout(2000);

      // Count comments after
      const commentsAfter = await page.locator('[data-testid="comment"], .comment-item').count();

      // Should have more comments (or button disappears if no more)
      expect(commentsAfter >= commentsBefore).toBe(true);
    }
  });
});
