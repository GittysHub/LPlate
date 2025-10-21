import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/LPlate/);
    await expect(page.locator('h1, h2')).toContainText(/LPlate|Find Instructors/);
  });

  test('Health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe('healthy');
    expect(typeof data.ts).toBe('number');
    expect(typeof data.timestamp).toBe('string');
  });

  test('Bookings page loads', async ({ page }) => {
    await page.goto('/bookings');
    // Should redirect to sign-in if not authenticated, or show bookings if authenticated
    await expect(page).toHaveURL(/\/sign-in|\/bookings/);
  });

  test('Search page loads', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('input[placeholder*="postcode"]')).toBeVisible();
  });

  test('Sign up page loads', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.locator('h1')).toContainText('Sign Up');
  });
});
