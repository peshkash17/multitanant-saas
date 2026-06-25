import { test, expect } from '@playwright/test';
import {
  DEFAULT_PASSWORD,
  clearAuthState,
  loginUser,
  logout,
  registerUser,
  uniqueEmail,
} from './helpers/auth';

const TEST_NAME = 'Playwright User';

test.describe.configure({ mode: 'serial' });

test.describe('Authentication', () => {
  const testEmail = uniqueEmail('auth');

  test('should show login page at root when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Create your account')).toBeVisible();

    await page.getByLabel('Full Name').fill(TEST_NAME);
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(DEFAULT_PASSWORD);
    await page.getByRole('button', { name: /Create Account/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.getByText(/Account created/i)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginUser(page, testEmail, DEFAULT_PASSWORD);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await clearAuthState(page);
    await page.getByLabel('Email').fill('wrong@test.com');
    await page.getByLabel('Password').fill('wrongpassword');

    const loginResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/login') && response.status() === 401,
    );
    await page.getByRole('button', { name: /Sign In/i }).click();
    await loginResponse;

    await expect(page.getByRole('alert')).toContainText(/invalid|login failed|credentials/i, {
      timeout: 5000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login after logout', async ({ page }) => {
    await loginUser(page, testEmail, DEFAULT_PASSWORD);
    await logout(page);
  });
});
