// src/e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming we have a mock API or test environment set up
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('should display user info', async ({ page }) => {
    const userInfo = page.locator('.user-info');
    await expect(userInfo).toContainText('Welcome, Test User');
  });

  test('should show project summary', async ({ page }) => {
    const projectSummary = page.locator('.project-summary');
    await expect(projectSummary).toBeVisible();
    await expect(projectSummary.locator('h2')).toHaveText('Project Summary');
    await expect(projectSummary.locator('.project-count')).toBeVisible();
  });

  test('should display recent activity', async ({ page }) => {
    const recentActivity = page.locator('.recent-activity');
    await expect(recentActivity).toBeVisible();
    await expect(recentActivity.locator('h2')).toHaveText('Recent Activity');
    await expect(recentActivity.locator('.activity-item')).toHaveCount(5);
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.click('text=View All Projects');
    await expect(page).toHaveURL('/projects');
  });

  test('should show performance metrics', async ({ page }) => {
    const performanceMetrics = page.locator('.performance-metrics');
    await expect(performanceMetrics).toBeVisible();
    await expect(performanceMetrics.locator('.metric')).toHaveCount(3);
  });

  test('should allow changing time range for metrics', async ({ page }) => {
    await page.selectOption('select[name="timeRange"]', '30days');
    await expect(page.locator('.loading-indicator')).toBeVisible();
    await expect(page.locator('.loading-indicator')).toBeHidden();
    // Check if metrics have updated - this would depend on your specific implementation
  });

  test('should show notifications', async ({ page }) => {
    const notificationBell = page.locator('.notification-bell');
    await notificationBell.click();
    const notificationPanel = page.locator('.notification-panel');
    await expect(notificationPanel).toBeVisible();
    await expect(notificationPanel.locator('.notification-item')).toHaveCount(3);
  });

  test('should allow logging out', async ({ page }) => {
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login');
  });
});
