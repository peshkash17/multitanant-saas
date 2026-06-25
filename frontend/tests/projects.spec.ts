import { test, expect } from '@playwright/test';
import { registerLoginAndCreateOrg } from './helpers/auth';

test.describe.configure({ mode: 'serial' });

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await registerLoginAndCreateOrg(page);
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.getByRole('button', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('button', { name: /New Project/i })).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /New Project/i }).click();

    await page.getByLabel('Project Name').fill('My Test Project');
    await page.getByLabel('Description').fill('A test project description');
    await page.getByRole('button', { name: /^Create$/i }).click();

    await expect(page.getByText('My Test Project')).toBeVisible({ timeout: 10000 });
  });

  test('should open task board for a project', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /New Project/i }).click();
    await page.getByLabel('Project Name').fill('Task Board Test');
    await page.getByRole('button', { name: /^Create$/i }).click();

    await expect(page.getByText('Task Board Test')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Open/i }).first().click();

    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('should create and display a task', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /New Project/i }).click();
    await page.getByLabel('Project Name').fill('Task Test Project');
    await page.getByRole('button', { name: /^Create$/i }).click();

    await page.getByRole('button', { name: /Open/i }).first().click();
    await page.getByRole('button', { name: /Add Task/i }).click();

    await page.getByLabel('Title').fill('My First Task');
    await page.getByLabel('Description').fill('Task description here');
    await page.getByRole('button', { name: /^Create$/i }).click();

    await expect(page.getByText('My First Task')).toBeVisible({ timeout: 10000 });
  });
});
