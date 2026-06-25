import { expect, Page } from '@playwright/test';

export const DEFAULT_PASSWORD = 'TestPass123!';

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@playwright.test`;
}

export function uniqueOrgName(prefix = 'Test Org') {
  return `${prefix} ${Math.random().toString(36).slice(2, 8)}`;
}

export async function clearAuthState(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
}

export async function registerUser(
  page: Page,
  email: string,
  name: string,
  password = DEFAULT_PASSWORD,
) {
  await page.goto('/register');
  await page.getByLabel('Full Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /Create Account/i }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
}

export async function loginUser(
  page: Page,
  email: string,
  password = DEFAULT_PASSWORD,
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

export async function createOrganization(page: Page, name?: string) {
  const orgName = name ?? uniqueOrgName();
  const createOrgButton = page.getByRole('button', { name: /Create Org|New Org/i });
  await expect(createOrgButton).toBeVisible({ timeout: 15000 });
  await createOrgButton.click();

  const dialog = page.getByRole('dialog', { name: 'Create Organization' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Name').fill(orgName);
  await dialog.getByRole('button', { name: /^Create$/i }).click();

  await expect(dialog).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('combobox')).toContainText(orgName, { timeout: 10000 });

  return orgName;
}

export async function registerLoginAndCreateOrg(
  page: Page,
  options?: { email?: string; name?: string; orgName?: string },
) {
  const email = options?.email ?? uniqueEmail('e2e');
  const name = options?.name ?? 'E2E User';

  await registerUser(page, email, name);
  await loginUser(page, email);
  const orgName = await createOrganization(page, options?.orgName);

  return { email, name, orgName };
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Account' }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login/);
}
